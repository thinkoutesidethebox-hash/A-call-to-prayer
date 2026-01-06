// Define process.env globally for the application
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  };
};
