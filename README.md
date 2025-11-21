# Messaging Service 💬

Microservicio de mensajería instantánea en tiempo real para aplicación de red social. Proporciona comunicación en tiempo real mediante WebSockets, gestión de conversaciones individuales y grupales, indicadores de escritura, recibos de lectura/entrega, y seguimiento de presencia de usuarios.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API REST](#api-rest)
- [WebSocket Events](#websocket-events)
- [Esquema de Base de Datos](#esquema-de-base-de-datos)
- [Integración con Otros Microservicios](#integración-con-otros-microservicios)
- [Despliegue](#despliegue)

## ✨ Características

### Mensajería en Tiempo Real
- ✅ Envío y recepción de mensajes instantáneos via WebSockets
- ✅ Mensajes de texto, imágenes, videos, audios y archivos
- ✅ Respuestas a mensajes (threads)
- ✅ Edición y eliminación de mensajes
- ✅ Estado de mensajes (enviado, entregado, leído)

### Conversaciones
- ✅ Conversaciones individuales (1-on-1)
- ✅ Conversaciones grupales con roles (admin/member)
- ✅ Gestión de participantes (agregar/remover)
- ✅ Historial de mensajes con paginación
- ✅ Contador de mensajes no leídos

### Indicadores de Presencia
- ✅ Estado en línea/desconectado/ausente
- ✅ Última vez visto
- ✅ Indicadores de "escribiendo..."
- ✅ Notificaciones en tiempo real de cambios de estado

### Seguridad
- ✅ Autenticación JWT
- ✅ Validación de participantes en conversaciones
- ✅ Control de acceso basado en roles

## 🏗️ Arquitectura

```
messaging-service/
├── src/
│   ├── config/                 # Configuración de BD
│   ├── infrastructure/
│   │   ├── migrations/        # Migraciones Sequelize
│   │   └── models/            # Modelos Sequelize
│   ├── application/
│   │   ├── controllers/       # Controladores REST
│   │   ├── services/          # Lógica de negocio
│   │   ├── middleware/        # Auth, validación, errores
│   │   └── routes.ts          # Definición de rutas
│   ├── websocket/
│   │   ├── handlers/          # Manejadores de eventos WS
│   │   └── socket.server.ts   # Servidor Socket.io
│   └── index.ts               # Punto de entrada
├── scripts/
│   └── deploy.sh              # Script de despliegue
└── package.json
```

### Stack Tecnológico
- **Runtime**: Node.js + TypeScript
- **Framework Web**: Express.js
- **WebSockets**: Socket.io
- **ORM**: Sequelize
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: express-validator

## 📦 Requisitos

- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm >= 7.x

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
cd messaging-service
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo de ejemplo y editarlo:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Server
NODE_ENV=development
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=messaging_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT (debe coincidir con Auth service)
JWT_SECRET=tu_secret_jwt

# External Services
AUTH_SERVICE_URL=http://localhost:3001
SOCIAL_SERVICE_URL=http://localhost:3002

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Crear base de datos y ejecutar migraciones

```bash
# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run migrate
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `NODE_ENV` | Entorno de ejecución | No | `development` |
| `PORT` | Puerto del servidor | No | `3003` |
| `DB_HOST` | Host de PostgreSQL | Sí | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | No | `5432` |
| `DB_NAME` | Nombre de la base de datos | Sí | `messaging_db` |
| `DB_USER` | Usuario de PostgreSQL | Sí | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | Sí | - |
| `JWT_SECRET` | Secreto para JWT | Sí | - |
| `AUTH_SERVICE_URL` | URL del servicio Auth | Sí | `http://localhost:3001` |
| `SOCIAL_SERVICE_URL` | URL del servicio Social | Sí | `http://localhost:3002` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos | No | `http://localhost:3000` |

## ▶️ Ejecución

### Modo Desarrollo

```bash
npm run dev
```

### Modo Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

### Con PM2 (Producción)

```bash
pm2 start dist/index.js --name messaging-service
pm2 save
```

## 📡 API REST

Todas las rutas requieren autenticación mediante token JWT en el header:
```
Authorization: Bearer <token>
```

### Conversaciones

#### Crear conversación

```http
POST /api/conversations
Content-Type: application/json

{
  "type": "individual",
  "participantIds": ["user-uuid-1"],
  "name": "Grupo de amigos",      // Opcional (requerido para grupos)
  "avatarUrl": "https://..."       // Opcional
}
```

**Respuesta exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "type": "individual",
    "name": null,
    "participants": [...],
    "created_at": "2025-01-21T00:00:00Z"
  }
}
```

#### Listar conversaciones del usuario

```http
GET /api/conversations?page=1&limit=20
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "conversations": [...],
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### Obtener conversación por ID

```http
GET /api/conversations/:id
```

#### Actualizar conversación (solo admins)

```http
PUT /api/conversations/:id
Content-Type: application/json

{
  "name": "Nuevo nombre",
  "avatar_url": "https://..."
}
```

#### Agregar participante (solo admins)

```http
POST /api/conversations/:id/participants
Content-Type: application/json

{
  "user_id": "user-uuid",
  "role": "member"
}
```

#### Remover participante

```http
DELETE /api/conversations/:id/participants/:userId
```

### Mensajes

#### Enviar mensaje (REST)

```http
POST /api/conversations/:conversationId/messages
Content-Type: application/json

{
  "content": "Hola! ¿Cómo estás?",
  "message_type": "text",
  "reply_to": "message-uuid",        // Opcional
  "media_reference": {...}           // Opcional
}
```

**Respuesta exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "conversation_id": "conv-uuid",
    "sender_id": "user-uuid",
    "content": "Hola! ¿Cómo estás?",
    "message_type": "text",
    "sent_at": "2025-01-21T00:00:00Z",
    "is_edited": false,
    "is_deleted": false,
    "statuses": [...]
  }
}
```

#### Obtener historial de mensajes

```http
GET /api/conversations/:conversationId/messages?page=1&limit=50&before=message-uuid
```

**Parámetros de query**:
- `page`: Número de página (default: 1)
- `limit`: Mensajes por página (default: 50, max: 100)
- `before`: UUID del mensaje para cargar mensajes anteriores (paginación infinita)

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "page": 1,
    "limit": 50,
    "total": 234,
    "hasMore": true
  }
}
```

#### Marcar mensaje como leído

```http
PUT /api/messages/:messageId/read
```

#### Marcar toda la conversación como leída

```http
PUT /api/conversations/:conversationId/read
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "count": 15
  }
}
```

#### Obtener contador de no leídos

```http
GET /api/conversations/:conversationId/unread
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### Editar mensaje

```http
PUT /api/messages/:messageId
Content-Type: application/json

{
  "content": "Mensaje editado"
}
```

#### Eliminar mensaje

```http
DELETE /api/messages/:messageId
```

### Presencia

#### Obtener presencia de usuario

```http
GET /api/presence/:userId
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "status": "online",
    "last_seen": "2025-01-21T00:00:00Z"
  }
}
```

#### Obtener presencia de múltiples usuarios

```http
POST /api/presence/batch
Content-Type: application/json

{
  "userIds": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```

## 🔌 WebSocket Events

### Conexión

Conectar con Socket.io incluyendo el token JWT:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Conectado!', socket.id);
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```

### Eventos del Cliente → Servidor

#### Enviar mensaje

```javascript
socket.emit('message:send', {
  conversationId: 'conv-uuid',
  content: 'Hola!',
  messageType: 'text',
  tempId: 'temp-id-123',  // ID temporal para optimistic UI
  replyTo: 'message-uuid',  // Opcional
  mediaReference: {...}     // Opcional
});
```

#### Marcar como entregado

```javascript
socket.emit('message:delivered', {
  messageId: 'message-uuid'
});
```

#### Marcar como leído

```javascript
socket.emit('message:read', {
  messageId: 'message-uuid',
  // O marcar toda la conversación:
  conversationId: 'conv-uuid'
});
```

#### Indicador de escritura - Inicio

```javascript
socket.emit('typing:start', {
  conversationId: 'conv-uuid'
});
```

#### Indicador de escritura - Fin

```javascript
socket.emit('typing:stop', {
  conversationId: 'conv-uuid'
});
```

#### Cambiar estado a ausente

```javascript
socket.emit('presence:away');
```

### Eventos del Servidor → Cliente

#### Nuevo mensaje recibido

```javascript
socket.on('message:new', (data) => {
  console.log('Nuevo mensaje:', data.message);
  console.log('En conversación:', data.conversationId);
});
```

#### Confirmación de mensaje enviado

```javascript
socket.on('message:sent', (data) => {
  console.log('Mensaje enviado exitosamente');
  console.log('Temp ID:', data.tempId);
  console.log('Mensaje final:', data.message);
});
```

#### Estado de mensaje actualizado

```javascript
socket.on('message:status', (data) => {
  console.log('Estado:', data.status);  // 'delivered' o 'read'
  console.log('Mensaje:', data.messageId);
  console.log('Usuario:', data.userId);
  console.log('Timestamp:', data.timestamp);
});
```

#### Indicador de escritura

```javascript
socket.on('typing:status', (data) => {
  console.log('Usuario:', data.username);
  console.log('Escribiendo:', data.isTyping);
  console.log('En conversación:', data.conversationId);
});
```

#### Actualización de presencia

```javascript
socket.on('presence:update', (data) => {
  console.log('Usuario:', data.username);
  console.log('Estado:', data.status);  // 'online', 'offline', 'away'
  console.log('Última vez visto:', data.last_seen);
});
```

## 🗄️ Esquema de Base de Datos

### Conversations
Tabla principal de conversaciones (individuales o grupales).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK - Identificador único |
| `type` | ENUM | Tipo: 'individual' o 'group' |
| `name` | VARCHAR | Nombre (para grupos) |
| `avatar_url` | VARCHAR | URL del avatar |
| `created_by` | UUID | Usuario creador |
| `last_message_at` | TIMESTAMP | Última actividad |
| `is_active` | BOOLEAN | Estado activo |

### Conversation_Participants
Participantes en conversaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK - Identificador único |
| `conversation_id` | UUID | FK → conversations |
| `user_id` | UUID | ID del usuario |
| `role` | ENUM | 'admin' o 'member' |
| `nickname` | VARCHAR | Apodo en la conversación |
| `muted` | BOOLEAN | Notificaciones silenciadas |
| `last_read_at` | TIMESTAMP | Última lectura |
| `joined_at` | TIMESTAMP | Fecha de ingreso |
| `left_at` | TIMESTAMP | Fecha de salida |

### Messages
Mensajes en conversaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK - Identificador único |
| `conversation_id` | UUID | FK → conversations |
| `sender_id` | UUID | Usuario que envió |
| `content` | TEXT | Contenido del mensaje |
| `message_type` | ENUM | 'text', 'image', 'video', 'audio', 'file', 'system' |
| `media_reference` | JSON | Referencia a media |
| `reply_to` | UUID | FK → messages (respuestas) |
| `metadata` | JSON | Metadatos adicionales |
| `is_edited` | BOOLEAN | Mensaje editado |
| `is_deleted` | BOOLEAN | Mensaje eliminado |
| `edited_at` | TIMESTAMP | Fecha de edición |
| `sent_at` | TIMESTAMP | Fecha de envío |

### Message_Status
Estados de mensajes (enviado, entregado, leído).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK - Identificador único |
| `message_id` | UUID | FK → messages |
| `user_id` | UUID | Usuario destinatario |
| `status` | ENUM | 'sent', 'delivered', 'read' |
| `timestamp` | TIMESTAMP | Fecha del estado |

### User_Presence
Presencia y estado de usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK - Identificador único |
| `user_id` | UUID | Usuario (único) |
| `status` | ENUM | 'online', 'offline', 'away' |
| `socket_id` | VARCHAR | ID del socket actual |
| `last_seen` | TIMESTAMP | Última actividad |

### Diagrama de Relaciones

```
conversations (1) ←→ (N) conversation_participants
conversations (1) → (N) messages
messages (1) → (N) message_status
messages (1) → (N) messages (self-reference para replies)
```

## 🔗 Integración con Otros Microservicios

### Auth Service
**Endpoint esperado**: `/api/auth/validate-token`
- **Propósito**: Validar tokens JWT (opcional, por defecto se valida localmente)
- **Método**: POST
- **Headers**: `Authorization: Bearer <token>`

### Social Service
**Endpoints esperados**:

1. `/api/profiles/:userId` (GET)
   - Obtener perfil de usuario
   
2. `/api/profiles/batch` (POST)
   - Obtener múltiples perfiles
   - Body: `{ "userIds": [...] }`

3. `/api/media/:mediaId` (GET)
   - Verificar referencia de media
   - Para mensajes con imágenes/videos

### Configuración de URLs

Configurar en `.env`:
```env
AUTH_SERVICE_URL=http://localhost:3001
SOCIAL_SERVICE_URL=http://localhost:3002
```

## 🚀 Despliegue

### Despliegue Automático

Ejecutar el script de despliegue:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

El script realiza:
1. ✅ Verificación de requisitos (Node.js, PostgreSQL)
2. ✅ Instalación de dependencias
3. ✅ Creación de base de datos
4. ✅ Ejecución de migraciones
5. ✅ Compilación de TypeScript
6. ✅ Inicio con PM2 (producción)

### Despliegue Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Crear base de datos
createdb messaging_db

# 3. Ejecutar migraciones
npm run migrate

# 4. Compilar
npm run build

# 5. Iniciar
NODE_ENV=production npm start
```

### Con Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["npm", "start"]
```

## 🧪 Pruebas

### Verificar Salud del Servicio

```bash
curl http://localhost:3003/health
```

### Ejemplo de Flujo Completo

```bash
# 1. Obtener token del servicio Auth
TOKEN="your-jwt-token"

# 2. Crear conversación
curl -X POST http://localhost:3003/api/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "individual",
    "participantIds": ["user-id-2"]
  }'

# 3. Enviar mensaje
curl -X POST http://localhost:3003/api/conversations/CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hola!",
    "message_type": "text"
  }'

# 4. Obtener historial
curl http://localhost:3003/api/conversations/CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Notas Importantes

### JWT Secret
- El `JWT_SECRET` **debe ser el mismo** que usa el servicio de Auth
- Esto permite validar tokens sin llamadas entre servicios

### IDs de Usuario
- Los `user_id` vienen del token JWT decodificado
- Deben coincidir con los UUIDs del servicio Auth/Social

### WebSocket y CORS
- Configurar `ALLOWED_ORIGINS` con los dominios permitidos
- En producción, especificar dominios exactos

### Escalabilidad
- Para múltiples instancias, usar Redis como adaptador de Socket.io
- Implementar un message broker (RabbitMQ/Kafka) para distribución de mensajes

## 🐛 Solución de Problemas

### Error: "Access token required"
- Verificar que el token JWT esté en el header Authorization
- Formato: `Bearer <token>`

### Error: "Invalid token"
- Verificar que JWT_SECRET coincida con Auth service
- Verificar que el token no haya expirado

### WebSocket no conecta
- Verificar CORS en `ALLOWED_ORIGINS`
- Verificar firewall/puertos
- Revisar que el token se envíe correctamente

### Migraciones fallan
- Verificar conexión a PostgreSQL
- Verificar credenciales en `.env`
- Ejecutar: `npm run migrate:status` para ver estado

## 📄 Licencia

MIT

## 👥 Autor

Desarrollado para el proyecto Aura Social Network

---

**Versión**: 1.0.0  
**Última actualización**: 2025-01-21
# aura_server-messaging-service
