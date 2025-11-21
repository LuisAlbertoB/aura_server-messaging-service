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
NODE_MIN_VERSION="16"
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
    print_warning "No ejecutar este script como root"
fi

# Step 1: Check Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
    print_error "Node.js versión $NODE_MIN_VERSION o superior es requerida"
    exit 1
fi
print_success "Node.js $(node -v) instalado"

# Step 2: Check npm
print_info "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm $(npm -v) instalado"

# Step 3: Check PostgreSQL
print_info "Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL no está instalado"
    echo "Instala PostgreSQL:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi
print_success "PostgreSQL instalado"

# Step 4: Navigate to project directory
print_info "Navegando al directorio del proyecto..."
cd "$PROJECT_DIR"
print_success "Directorio: $PROJECT_DIR"

# Step 5: Check .env file
print_info "Verificando archivo .env..."
if [ ! -f .env ]; then
    print_warning ".env no encontrado, creando desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Por favor, edita .env con tus configuraciones antes de continuar"
        echo "Presiona Enter para continuar después de editar .env..."
        read
    else
        print_error ".env.example no encontrado"
        exit 1
    fi
fi
print_success "Archivo .env existe"

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Step 6: Install dependencies
print_info "Instalando dependencias..."
npm install
print_success "Dependencias instaladas"

# Step 7: Create database if not exists
print_info "Verificando base de datos PostgreSQL..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    print_info "Creando base de datos $DB_NAME..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || {
        print_error "No se pudo crear la base de datos"
        print_info "Intentando crear manualmente..."
        sudo -u postgres createdb $DB_NAME
    }
    print_success "Base de datos $DB_NAME creada"
else
    print_success "Base de datos $DB_NAME ya existe"
fi

# Step 8: Run migrations
print_info "Ejecutando migraciones de base de datos..."
npm run migrate
print_success "Migraciones completadas"

# Step 9: Build TypeScript
print_info "Compilando TypeScript..."
npm run build
print_success "Compilación exitosa"

# Step 10: Check if PM2 is installed (for production)
if [ "$NODE_ENV" = "production" ]; then
    print_info "Verificando PM2..."
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 no está instalado, instalando globalmente..."
        sudo npm install -g pm2
        print_success "PM2 instalado"
    else
        print_success "PM2 ya está instalado"
    fi

    # Step 11: Start with PM2
    print_info "Iniciando servicio con PM2..."
    pm2 stop $SERVICE_NAME 2>/dev/null || true
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    pm2 start dist/index.js --name $SERVICE_NAME
    pm2 save
    print_success "Servicio iniciado con PM2"
    
    # Show PM2 status
    pm2 status
else
    # Development mode
    print_success "Despliegue completado para desarrollo"
    print_info "Para iniciar el servidor en modo desarrollo:"
    echo "  npm run dev"
    print_info "Para iniciar el servidor en modo producción:"
    echo "  npm start"
fi

# Step 12: Final summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Despliegue completado exitosamente${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
print_info "Información del servicio:"
echo "  Puerto: ${PORT:-3003}"
echo "  Base de datos: $DB_NAME"
echo "  Entorno: ${NODE_ENV:-development}"
echo ""
print_info "Endpoints disponibles:"
echo "  Health check: http://localhost:${PORT:-3003}/health"
echo "  API REST: http://localhost:${PORT:-3003}/api"
echo "  WebSocket: ws://localhost:${PORT:-3003}"
echo ""
print_info "Logs (si se usa PM2):"
echo "  pm2 logs $SERVICE_NAME"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
