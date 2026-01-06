// Removed reference to vite/client to fix "Cannot find type definition file" error
// The process.env.API_KEY is defined via vite.config.ts

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
