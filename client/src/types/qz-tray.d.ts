// Declaración de tipos para QZ Tray
// Esto permite que TypeScript reconozca la variable global 'qz' que se carga desde un script externo

declare const qz: {
  websocket: {
    connect: (options?: { 
      host?: string[] | string, 
      usingSecure?: boolean,
      secure?: boolean, // Añadido para compatibilidad con versiones más recientes
      retries?: number,
      delay?: number
    }) => Promise<any>;
    disconnect: () => Promise<void>;
    isActive: () => boolean;
    getHostname: () => Promise<string>;
    getPlatform: () => Promise<string>;
    getVersion: () => Promise<string>;
  };
  security: {
    setCertificatePromise: (callback: (resolve: (cert: string | null) => void, reject: (err: any) => void) => void) => void;
    setSignaturePromise: (callback: (toSign: any) => (resolve: (sig: any) => void, reject: (err: any) => void) => void) => void;
  };
  api: {
    setPromiseType: (resolver: (resolve: any, reject: any) => { resolve: any, reject: any }) => void;
    setSha: (sha: string) => void;
  };
  printers: {
    find: () => Promise<string[]>;
    getDefault: () => Promise<string | null>;
    getProperties: (printer: string) => Promise<any>;
  };
  configs: {
    create: (printer: string, options?: any) => any;
  };
  print: (config: any, data: any) => Promise<any>;
};