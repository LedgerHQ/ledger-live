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
    simulator: {
      type: string;
      device: {
        type: string;
      };
    };
    emulator: {
      type: string;
      device: {
        avdName: string;
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
