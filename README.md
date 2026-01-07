# Fonicris Inventory System

Sistema de control y gestión de inventarios moderno, desarrollado con tecnologías web de última generación para ofrecer una experiencia de usuario rápida, segura y eficiente.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73CFC?style=for-the-badge&logo=vite&logoColor=white)

## 📋 Descripción

**Fonicris Inventory** es una aplicación web SPA (Single Page Application) diseñada para administrar el ciclo de vida de los activos de la empresa. Permite realizar seguimiento de equipos, muebles y otros recursos, categorizándolos por estado (Nuevo, Usado, Dañado), ubicación y responsable.

## ✨ Características Principales

- **📊 Dashboard Interactivo:** Visualización rápida de métricas clave (Total de activos, valorización, estados).
- **🛡️ Autenticación y Seguridad:** Sistema de login y protección de rutas basado en roles.
- **📦 Gestión de Inventario:** Listado completo con opciones de búsqueda, filtrado por grupo/zona y ordenamiento.
- **📱 Diseño Responsivo:** Interfaz adaptada a dispositivos móviles y de escritorio.
- **📈 Reportes y Gráficos:** Análisis visual de la distribución de activos.
- **📤 Exportación de Datos:** Capacidad para exportar inventarios a formatos como Excel.
- **🔳 Códigos QR:** Generación de etiquetas QR para el seguimiento físico de activos.

## 🛠️ Tecnologías Utilizadas

- **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Enrutamiento:** [React Router](https://reactrouter.com/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Utilidades:** 
  - `xlsx` (Manejo de hojas de cálculo)
  - `qrcode.react` (Generación de códigos QR)

## 🚀 Instalación y Uso

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### Prerrequisitos

- Node.js (Versión 18 o superior recomendada)
- npm o yarn

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/fonicris-inventory.git
    cd fonicris-inventory
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto si es necesario (basado en `.env.example`).

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique la consola).

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run lint`: Ejecuta el linter para encontrar errores de código.
- `npm run preview`: Vista previa de la build de producción localmente.

## 📂 Estructura del Proyecto

```
src/
├── components/   # Componentes reutilizables (Botones, Layouts, Tablas)
├── pages/        # Vistas principales (Login, Dashboard, Inventory)
├── store/        # Estado global (Zustand)
├── types/        # Definiciones de tipos TypeScript
├── utils/        # Funciones de utilidad
├── App.tsx       # Componente raíz y configuración de rutas
└── main.tsx      # Punto de entrada
```

---
Desarrollado para **Fonicris**.
