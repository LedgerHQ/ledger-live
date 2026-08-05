// Detoxconfig
declare let detoxConfig: {
  extends: string;
  testRunner: Record<string, unknown>;
  logger: Record<string, unknown>;
  session: Record<string, unknown>;
  artifacts: Record<string, unknown>;
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
        type?: string;
        name: string;
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
