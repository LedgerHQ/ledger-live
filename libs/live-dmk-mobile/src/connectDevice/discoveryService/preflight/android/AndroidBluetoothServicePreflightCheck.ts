import { State as BlePlxState } from "react-native-ble-plx";
import { BlePlxManager } from "../../../../transport/BlePlxManager";
import type { DiscoveryError } from "../../../types";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildBluetoothDisabledManualActionError,
  buildBluetoothDisabledPromptableError,
  buildBluetoothStateError,
} from "../discoveryErrorBuilders";
import { getBluetoothHelperModule, getNativeErrorCode } from "../nativeModules";
import {
  mapDiscoveryErrorToPreflightResult,
  successPreflightResult,
  type DiscoveryPreflightResult,
} from "../preflightResult";

export type BleStateProvider = {
  getState(): Promise<BlePlxState>;
};

const defaultBleStateProvider: BleStateProvider = {
  getState: () => BlePlxManager.state(),
};

/**
 * Checks whether the Android Bluetooth service is enabled before BLE discovery starts.
 *
 * If Bluetooth is powered off, the check uses the native helper prompt when available and then
 * verifies the state again before deciding whether the user must act manually.
 */
export class AndroidBluetoothServicePreflightCheck {
  constructor(
    private readonly retry: () => Promise<true | DiscoveryError>,
    private readonly bleStateProvider = defaultBleStateProvider,
    private readonly getBluetoothHelper = getBluetoothHelperModule,
  ) {}

  async run(_requirements: AndroidPreflightRequirements): Promise<DiscoveryPreflightResult> {
    const state = await this.bleStateProvider.getState();

    if (state === BlePlxState.PoweredOn) {
      return successPreflightResult;
    }

    if (state === BlePlxState.PoweredOff) {
      return this.promptBluetoothService();
    }

    return mapDiscoveryErrorToPreflightResult(buildBluetoothStateError(state, this.retry));
  }

  /**
   * Prompt the user to enable Bluetooth and check the state again.
   */
  private async promptBluetoothService(): Promise<DiscoveryPreflightResult> {
    const bluetoothHelperModule = this.getBluetoothHelper();

    if (!bluetoothHelperModule?.prompt) {
      return mapDiscoveryErrorToPreflightResult(
        buildBluetoothDisabledManualActionError(this.retry),
      );
    }

    try {
      await bluetoothHelperModule.prompt();
      const state = await this.bleStateProvider.getState();
      return this.mapStateAfterBluetoothPrompt(state);
    } catch (error) {
      return mapDiscoveryErrorToPreflightResult(
        getNativeErrorCode(error) === bluetoothHelperModule.E_BLE_CANCELLED
          ? buildBluetoothDisabledPromptableError(this.retry)
          : buildBluetoothDisabledManualActionError(this.retry, error),
      );
    }
  }

  private mapStateAfterBluetoothPrompt(state: BlePlxState): DiscoveryPreflightResult {
    if (state === BlePlxState.PoweredOn) {
      return successPreflightResult;
    }

    return mapDiscoveryErrorToPreflightResult(
      state === BlePlxState.PoweredOff
        ? buildBluetoothDisabledManualActionError(this.retry)
        : buildBluetoothStateError(state, this.retry),
    );
  }
}
