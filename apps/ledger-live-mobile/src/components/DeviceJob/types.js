// @flow

import type { Observable } from "rxjs";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

// meta object are accumulated over steps
export type Step = {
  Body: React$ComponentType<{
    meta: Device & Object,
    onDone: () => void,
    onClose?: () => void,
    colors: *,
  }>,

  ErrorFooter?: React$ComponentType<{
    onRetry: () => void,
  }>,

  run: (meta: Object, onDoneO: Observable<*>) => Observable<Object>,
};
