# FONICRIS - Sistema de Gestión de Inventario

Sistema web para gestión de inventario desarrollado con React, TypeScript y Tailwind CSS. Utiliza Google Sheets como base de datos y Google Drive para almacenamiento de imágenes.

## Características

- 📊 **Dashboard** - Estadísticas y gráficos del inventario
- 📦 **Inventario** - CRUD completo de activos con búsqueda y filtros
- 👥 **Colaboradores** - Gestión de usuarios (solo Admin/Prime)
- 📜 **Historial** - Registro de actividad y activos eliminados (solo Prime)
- 🔐 **Autenticación** - Sistema de roles (Prime, Admin, Editor, Visualizador)
- 🌙 **Modo oscuro** - Tema claro/oscuro
- 📱 **Responsive** - Diseño adaptable a móviles

## Roles de Usuario

| Rol | Letra | Permisos |
|-----|-------|----------|
| Prime | Z | Acceso total + editar colaboradores |
| Admin | A | Todo excepto Historial |
| Editor | B | Dashboard + Inventario (CRUD) |
| Visualizador | C | Dashboard + Inventario (solo lectura) |

## Requisitos

- Node.js 18+
- Cuenta de Google Cloud con Service Account
- Google Sheets con las hojas: Activos, Usuarios, Historial, Logs

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/fonicris-inventario.git
cd fonicris-inventario
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

4. Configura las variables de entorno en `.env`:
   - `VITE_GOOGLE_SPREADSHEET_ID` - ID de tu Google Sheet
   - `VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL` - Email de la Service Account
   - `VITE_GOOGLE_PRIVATE_KEY` - Clave privada de la Service Account
   - `VITE_GOOGLE_DRIVE_FOLDER_ID` - ID de la carpeta de Drive para imágenes

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Configuración de Google Sheets

### Hoja "Activos" (desde fila 5)
| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| # | CodigoId | Nombre | Marca | Cantidad | Estado | Responsable | FechaIngreso | Grupo | Zona | Observaciones | Valoracion | ImagenUrl |

### Hoja "Usuarios" (desde fila 2)
| A | B | C | D |
|---|---|---|---|
| Email | Password | Nombre | Rol (Z/A/B/C) |

### Hoja "Historial" (desde fila 6)
| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| # | CodigoId | Nombre | Marca | Cantidad | Estado | Responsable | FechaIngreso | Grupo | Zona | Observaciones | Valoracion | ImagenUrl | FechaEliminacion |

### Hoja "Logs" (desde fila 2)
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| # | Fecha | Hora | Usuario | Acción | Detalle |

## Configuración de Google Cloud

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilita las APIs:
   - Google Sheets API
   - Google Drive API
3. Crea una Service Account y descarga las credenciales JSON
4. Comparte tu Google Sheet con el email de la Service Account (permisos de Editor)
5. Comparte la carpeta de Drive con el email de la Service Account (permisos de Editor)

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## Tecnologías

- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) - Estado global
- [React Router](https://reactrouter.com/) - Navegación
- [Recharts](https://recharts.org/) - Gráficos
- [Lucide React](https://lucide.dev/) - Iconos

## Licencia

MIT
