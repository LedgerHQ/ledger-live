export enum PreChecksStateType {
  LOADING = "LOADING",
  BATTERY_TOO_LOW = "BATTERY_TOO_LOW",
  DEVICE_LOCKED = "DEVICE_LOCKED",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export type PreChecksState =
  | {
      type: PreChecksStateType.LOADING;
    }
  | {
      type: PreChecksStateType.BATTERY_TOO_LOW;
      currentPercentage: number;
      cancel: () => void;
    }
  | {
      type: PreChecksStateType.DEVICE_LOCKED;
    }
  | {
      type: PreChecksStateType.DEVICE_DISCONNECTED;
    }
  | {
      type: PreChecksStateType.UNEXPECTED_ERROR;
      cancel: () => void;
    };
