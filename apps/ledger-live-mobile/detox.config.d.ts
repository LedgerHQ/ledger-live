// Detoxconfig
declare let detoxConfig: {
  testRunner: Record<string, unknown>;
  behavior: Record<string, unknown>;
  apps: {
    [key: string]: {
      type: string;
      build: string;
      binaryPath: string;
    };
  };
  devices: {
    [key: string]: {
      type: string;
      device: {
        type?: string;
        name?: string;
        avdName?: string;
      };
    };
  };
  configurations: {
    [key: string]: {
      device: string;
      app: string;
    };
  };
};

export default detoxConfig;
