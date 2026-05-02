interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  [key: string]: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
