// @flow

import type { Observable } from "rxjs";

// meta object are accumulated over steps
export type Step = {
  Body: React$ComponentType<{ deviceName: string, onDone: () => void }>,
  ErrorFooter?: React$ComponentType<{ onRetry: () => void }>,
  run: (
    deviceId: string,
    meta: Object,
    onDoneO: Observable<*>,
  ) => Observable<Object>,
};
