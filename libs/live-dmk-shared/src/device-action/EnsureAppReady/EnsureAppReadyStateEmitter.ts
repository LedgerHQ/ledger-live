import {
  type InstallPlan,
  type DeviceSessionState,
  DeviceActionStatus,
} from "@ledgerhq/device-management-kit";
import { mapConnectAppDAErrorStatus, mapConnectAppDAPendingStatus } from "./stateMapping";
import type { ConnectAppDAState } from "../ConnectApp/types";
import type { ConnectAppDASnapshotHandler } from "./ConnectAppEventHandler";
import type { DeprecationPresentationInput, StateEmitter } from "./types";
import { log } from "@ledgerhq/logs";

export type EnsureAppReadyStateEmitterParams = {
  observer: StateEmitter;
  appName: string;
  deprecation?: DeprecationPresentationInput;
  deprecationDismissedCurrencyNames: string[];
  getCurrentDeviceState: () => DeviceSessionState;
  retry: () => void;
};

/**
 * Emits the job state to the observer.
 */
export class EnsureAppReadyStateEmitter implements ConnectAppDASnapshotHandler {
  private latestInstallPlan: InstallPlan | null = null;

  constructor(private readonly params: EnsureAppReadyStateEmitterParams) {}

  handleSnapshot(state: ConnectAppDAState) {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        this.handlePendingState(state);
        break;
      case DeviceActionStatus.Error:
        this.handleErrorState(state);
        break;
      case DeviceActionStatus.Completed:
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Stopped:
        break;
    }
  }

  private handleErrorState(
    state: Extract<ConnectAppDAState, { status: DeviceActionStatus.Error }>,
  ) {
    const mappedState = mapConnectAppDAErrorStatus({
      state,
      appName: this.params.appName,
      getCurrentDeviceState: this.params.getCurrentDeviceState,
      latestInstallPlan: this.latestInstallPlan,
      retry: this.params.retry,
    });
    log("[EnsureAppReady]", "EnsureAppReadyStateEmitter: handleErrorState", { state, mappedState });

    if (mappedState) {
      this.params.observer.next(mappedState);
    }
  }

  private handlePendingState(
    state: Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>,
  ) {
    if (state.intermediateValue.installPlan) {
      this.latestInstallPlan = state.intermediateValue.installPlan;
    }

    const mappedState = mapConnectAppDAPendingStatus({
      state,
      deprecation: this.params.deprecation,
      deprecationDismissedCurrencyNames: this.params.deprecationDismissedCurrencyNames,
    });

    log("[EnsureAppReady]", "EnsureAppReadyStateEmitter: handlePendingState", {
      state,
      mappedState,
    });

    if (mappedState) {
      this.params.observer.next(mappedState);
    }
  }
}
