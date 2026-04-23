import type { ConnectAppDAState } from "../ConnectApp/types";

export interface ConnectAppDASnapshotHandler {
  handleSnapshot(state: ConnectAppDAState): void;
}
