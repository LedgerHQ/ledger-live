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
    meta: Record<string, any>,
    onDoneO: Observable<any>,
  ) => Observable<Record<string, any>>;
};
