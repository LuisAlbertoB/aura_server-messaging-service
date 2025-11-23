#!/bin/bash

# ============================================
# Messaging Service Deployment Script
# ============================================
# Este script automatiza el despliegue del 
# microservicio de mensajería instantánea
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="messaging-service"
DB_NAME="messaging_db"
NODE_MIN_VERSION="18"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Messaging Service Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "No ejecutar este script como root. El script pedirá sudo cuando sea necesario."
fi

# ============================================
# 1. System Dependencies & Stack Installation
# ============================================

install_system_dependencies() {
    print_info "Verificando dependencias del sistema..."
    
    # Update package list
    sudo apt-get update

    # Install basic tools
    sudo apt-get install -y curl git build-essential openssl
}

check_and_install_node() {
    print_info "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no encontrado. Instalando Node.js $NODE_MIN_VERSION..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
            print_warning "Versión de Node.js antigua ($NODE_VERSION). Actualizando a $NODE_MIN_VERSION..."
            curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    fi
    print_success "Node.js $(node -v) listo"
    print_success "npm $(npm -v) listo"
}

check_and_install_postgres() {
    print_info "Verificando PostgreSQL..."
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL no encontrado. Instalando..."
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    print_success "PostgreSQL instalado y corriendo"
}

# Execute installation steps
install_system_dependencies
check_and_install_node
check_and_install_postgres

# ============================================
# 2. Project Setup
# ============================================

# Navigate to project directory
print_info "Navegando al directorio del proyecto..."
cd "$PROJECT_DIR"
print_success "Directorio: $PROJECT_DIR"

# ============================================
# 3. Environment Configuration
# ============================================

setup_environment() {
    print_info "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        print_warning ".env no encontrado. Generando desde .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            
            # Generate secure credentials
            DB_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')
            JWT_SEC=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9')
            
            # Update .env with generated credentials
            # Use | as delimiter for sed to avoid issues with special chars in passwords
            sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" .env
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SEC}|" .env
            
            print_success "Archivo .env creado con credenciales seguras generadas"
        else
            print_error ".env.example no encontrado"
            exit 1
        fi
    else
        print_success "Archivo .env ya existe"
    fi
}

setup_environment

# Load environment variables for the script to use
export $(cat .env | grep -v '^#' | xargs)

# ============================================
# 4. Database Setup
# ============================================

setup_database() {
    print_info "Configurando base de datos..."
    
    # Check if user exists, create if not
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")
    if [ "$USER_EXISTS" != "1" ]; then
        print_info "Creando usuario de base de datos $DB_USER..."
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        sudo -u postgres psql -c "ALTER USER $DB_USER WITH CREATEDB;"
        print_success "Usuario $DB_USER creado"
    else
        print_success "Usuario $DB_USER ya existe"
        # Ensure password matches .env (optional, but good for consistency if env changed)
        sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    fi

    # Check if DB exists, create if not
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    if [ "$DB_EXISTS" != "1" ]; then
        print_info "Creando base de datos $DB_NAME..."
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        print_success "Base de datos $DB_NAME creada"
    else
        print_success "Base de datos $DB_NAME ya existe"
    fi
    
    # Grant privileges
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null
}

setup_database

# ============================================
# 5. Build & Deploy
# ============================================

# Install dependencies
print_info "Instalando dependencias del proyecto..."
npm install
print_success "Dependencias instaladas"

# Run migrations
print_info "Ejecutando migraciones..."
npm run migrate
print_success "Migraciones completadas"

# Build
print_info "Compilando TypeScript..."
npm run build
print_success "Compilación exitosa"

# Start with PM2
if [ "$NODE_ENV" = "production" ] || [ "$1" == "--prod" ]; then
    print_info "Configurando PM2 para producción..."
    
    if ! command -v pm2 &> /dev/null; then
        print_warning "Instalando PM2 globalmente..."
        sudo npm install -g pm2
    fi

    pm2 stop $SERVICE_NAME 2>/dev/null || true
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    
    # Start app
    pm2 start dist/index.js --name $SERVICE_NAME
    pm2 save
    
    print_success "Servicio desplegado con PM2"
    pm2 status
else
    print_success "Setup completado para desarrollo"
    print_info "Para iniciar el servidor:"
    echo "  npm run dev"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Despliegue completado exitosamente${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
print_info "Credenciales generadas (guardadas en .env):"
echo "  DB User: $DB_USER"
echo "  DB Name: $DB_NAME"
echo ""
print_info "Comandos útiles:"
echo "  Ver logs: pm2 logs $SERVICE_NAME"
echo "  Reiniciar: pm2 restart $SERVICE_NAME"
echo ""

