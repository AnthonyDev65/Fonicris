/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_SPREADSHEET_ID: string;
    readonly VITE_GOOGLE_DRIVE_FOLDER_ID: string;
    readonly VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
    readonly VITE_GOOGLE_PRIVATE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
