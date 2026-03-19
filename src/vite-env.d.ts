/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_STRIPE_DONATION_URL?: string;
  readonly VITE_STRIPE_DONATION_MONTHLY_URL?: string;
  readonly VITE_VENMO_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
