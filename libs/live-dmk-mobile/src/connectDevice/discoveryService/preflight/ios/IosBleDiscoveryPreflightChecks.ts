import { State as BlePlxState } from "react-native-ble-plx";
import { BlePlxManager } from "../../../../transport/BlePlxManager";
import { type DiscoveryError } from "../../../types";
import {
  buildBluetoothDisabledManualActionError,
  buildBluetoothStateError,
  buildUnknownDiscoveryError,
} from "../discoveryErrorBuilders";
import { getBluetoothHelperModule } from "../nativeModules";
import {
  mapDiscoveryErrorToPreflightResult,
  retryPreflightCheck,
  successPreflightResult,
  type DiscoveryPreflightChecks,
  type DiscoveryPreflightResult,
} from "../preflightResult";

export class IosBleDiscoveryPreflightChecks implements DiscoveryPreflightChecks {
  async getPreflight(): Promise<DiscoveryPreflightResult> {
    await this.promptBluetoothState();

    return this.checkBluetoothState();
  }

  private async promptBluetoothState(): Promise<void> {
    await getBluetoothHelperModule()
      ?.prompt?.()
      .catch(() => undefined);
  }

  private async checkBluetoothState(): Promise<DiscoveryPreflightResult> {
    try {
      const state = await BlePlxManager.state();

      if (state === BlePlxState.PoweredOn) {
        return successPreflightResult;
      }

      return mapDiscoveryErrorToPreflightResult(this.buildBluetoothStateError(state));
    } catch (error) {
      return mapDiscoveryErrorToPreflightResult(
        buildUnknownDiscoveryError(error, () => retryPreflightCheck(() => this.getPreflight())),
      );
    }
  }

  private buildBluetoothStateError(state: BlePlxState): DiscoveryError {
    const retry = () => retryPreflightCheck(() => this.getPreflight());

    return state === BlePlxState.PoweredOff
      ? buildBluetoothDisabledManualActionError(retry)
      : buildBluetoothStateError(state, retry);
  }
}
