/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOOM_REPORT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
