declare const INDEX_URL: string;
declare const __SENTRY_URL__: string;
declare const __APP_VERSION__: string;
declare const __GIT_REVISION__: string;
declare const __PRERELEASE__: string;
declare const __CHANNEL__: string;
declare const __static: string;
declare const __DEV__: boolean;

declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.webm";
declare module "*.mp4";

type Store = import("redux").Store;
type Device = import("@ledgerhq/live-common/hw/actions/types").Device;
type ReplaySubject = import("rxjs").ReplaySubject<unknown>;
type ListAppResult = import("@ledgerhq/live-common/apps/types").ListAppsResult;
type TransactionRaw = import("@ledgerhq/live-common/generated/types").TransactionRaw;
type Transaction = import("@ledgerhq/live-common/generated/types").Transaction;
type UpdateStatus = import("./src/main/updater/init").UpdateStatus;

interface RawEvents {
  [key: string]: unknown;
}

declare namespace Electron {
  interface BrowserWindow {
    name?: string;
  }

  interface App {
    dirname?: string;
  }
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;

  api: {
    pathUserdata: string;
    pathHome: string;
    appDirname: string;
    appLoaded: () => void;
    reloadRenderer: () => void;
    openWindow: (id: number) => void;
  };

  // for debugging purposes
  ledger: {
    store: Store;
    addDevice: (device: Device) => void;
    removeDevice: (device: Device) => void;
    resetDevices: () => void;
  };

  // used for the analytics, initialized in the index.html
  // eslint-disable-next-line
  analytics: any;

  // for mocking purposes apparently?
  // eslint-disable-next-line
  mock: {
    fromTransactionRaw: (rawTransaction: TransactionRaw) => Transaction;
    updater?: {
      setStatus?: (a: UpdateStatus) => void;
      quitAndInstall?: () => void;
    };
    events: {
      test: number;
      queue: Record<string, unknown>[];
      history: Record<string, unknown>[];
      subject: ReplaySubject;
      parseRawEvents: (rawEvents: RawEvents | RawEvents[], maybeKey?: string) => unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emitter: any;
      mockDeviceEvent: (...args: RawEvents[]) => void;
      exposed: {
        mockListAppsResult: (
          appDesc: string,
          installedDesc: string,
          deviceInfo: import("@ledgerhq/types-live").DeviceInfo,
          deviceModelId?: import("@ledgerhq/types-devices").DeviceModelId,
        ) => ListAppResult;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deviceInfo155: any;
      };
    };
  };
}
