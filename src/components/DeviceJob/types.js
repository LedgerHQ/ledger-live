// @flow

import type { Observable } from "rxjs";

export type DeviceMeta = {
  deviceId: string,
  deviceName: string,
  modelId: "blue" | "nanoS" | "nanoX",
  wired: boolean,
};

// meta object are accumulated over steps
export type Step = {
  Body: React$ComponentType<{
    meta: DeviceMeta & Object,
    onDone: () => void,
  }>,

  ErrorFooter?: React$ComponentType<{
    onRetry: () => void,
  }>,

  run: (meta: Object, onDoneO: Observable<*>) => Observable<Object>,
};
