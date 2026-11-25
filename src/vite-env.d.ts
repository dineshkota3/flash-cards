/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Same-origin API on Cloudflare — no build-time env vars needed.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
