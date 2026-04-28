import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import type { ConnectAppDAState } from "../ConnectApp/types";
import { ConnectAppDASnapshotHandler } from "./ConnectAppEventHandler";
import type {
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";

export type ConnectAppCompletionCapture = {
  readonly deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  readonly derivation: string | undefined;
  readonly currentApp: GetAppAndVersionResponse | undefined;
};

/**
 * Captures the completion data from the connect app device action.
 */
export class ConnectAppCompletionCapturer implements ConnectAppDASnapshotHandler {
  private completionCapture: ConnectAppCompletionCapture | null = null;

  handleSnapshot(state: ConnectAppDAState): void {
    if (state.status === DeviceActionStatus.Completed) {
      this.completionCapture = {
        deviceMetadata: state.output.deviceMetadata,
        derivation: state.output.derivation,
        currentApp: state.output.currentApp,
      };
    }
  }

  getCompletionCapture(): ConnectAppCompletionCapture | null {
    return this.completionCapture;
  }
}
