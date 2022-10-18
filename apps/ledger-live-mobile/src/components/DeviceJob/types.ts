import type { Observable } from "rxjs";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Theme } from "../../colors";
// meta object are accumulated over steps
export type Step = {
  Body: React.ComponentType<{
    meta: Device & Record<string, unknown>;
    onDone: () => void;
    onClose?: () => void;
    colors: Theme["colors"];
    step?: Step;
  }>;
  ErrorFooter?: React.ComponentType<{
    onRetry: () => void;
  }>;
  run: (
    meta: Record<string, unknown>,
    onDoneO: Observable<unknown>,
  ) => Observable<Record<string, unknown>>;
};
