# Manual Técnico del Proyecto Agricord v1

## Índice
1. Introducción
2. Estructura del Proyecto
3. Instalación y Configuración
4. Descripción de Componentes
5. Base de Datos
6. Endpoints y API
7. Ejecución y Pruebas
8. Mantenimiento y Recomendaciones

---

## 1. Introducción
Este manual técnico describe la arquitectura, componentes, instalación y mantenimiento del sistema Agricord v1, una plataforma para la gestión agrícola.

## 2. Estructura del Proyecto
- `server.js`: Servidor principal Node.js
- `config/`: Configuración de la base de datos
- `css/`: Hojas de estilo para las vistas
- `HTML/`: Archivos HTML de las vistas
- `js/`: Scripts JavaScript para la lógica de frontend
- `python/`: Scripts Python auxiliares
- `uploads/`: Carpeta para archivos subidos

## 3. Instalación y Configuración
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar la base de datos en `config/db.js`.
4. Iniciar el servidor:
   ```bash
   node server.js
   ```

## 4. Descripción de Componentes
### Backend (Node.js)
- `server.js`: Define rutas, middlewares y conexión a la base de datos.
- `config/db.js`: Configuración de conexión a la base de datos.

### Frontend
- `HTML/`: Vistas para cada módulo (usuarios, gastos, proveedores, etc.)
- `js/`: Scripts para interacción con la API y manipulación del DOM.
- `css/`: Estilos personalizados para cada vista.

### Python
- Scripts para funcionalidades específicas (ej: recuperación de contraseña).

## 5. Base de Datos
- Utiliza MySQL o similar.
- Tablas principales: Usuarios, Proveedores, Gastos, Productos, etc.
- Consultas y scripts en `config/db.js` y `js/conexion_BD.js`.

## 6. Endpoints y API
- Autenticación: `/login`, `/logout`
- Usuarios: `/usuarios`, `/usuarios/:id`
- Proveedores: `/proveedor`
- Gastos: `/gastos`, `/gastos/usuario/:id`

## 7. Ejecución y Pruebas
- Iniciar el servidor y acceder a las vistas HTML desde el navegador.
- Probar funcionalidades de login, CRUD de usuarios, gastos y proveedores.
- Verificar subida de archivos en `uploads/`.

## 8. Mantenimiento y Recomendaciones
- Mantener actualizado Node.js y dependencias.
- Realizar backups periódicos de la base de datos.
- Documentar cambios en el código y rutas.
- Revisar y actualizar scripts Python según necesidades.

---

**Autor:** Equipo Agricord
**Fecha:** Diciembre 2025
