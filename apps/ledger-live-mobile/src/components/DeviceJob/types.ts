import type { Observable } from "rxjs";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
// meta object are accumulated over steps
export type Step = {
  Body: React.ComponentType<{
    meta: Device & Record<string, any>;
    onDone: () => void;
    onClose?: () => void;
    colors: any;
  }>;
  ErrorFooter?: React.ComponentType<{
    onRetry: () => void;
  }>;
  run: (
    // eslint-disable-next-line no-unused-vars
    meta: Record<string, any>,
    // eslint-disable-next-line no-unused-vars
    onDoneO: Observable<any>,
  ) => Observable<Record<string, any>>;
};
