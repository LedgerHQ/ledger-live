import type { MobileDiscoveryError } from "../../../types";
import { AndroidBluetoothPermissionPreflightCheck } from "./AndroidBluetoothPermissionPreflightCheck";
import { AndroidBluetoothServicePreflightCheck } from "./AndroidBluetoothServicePreflightCheck";
import { AndroidLocationPermissionPreflightCheck } from "./AndroidLocationPermissionPreflightCheck";
import { AndroidLocationServicePreflightCheck } from "./AndroidLocationServicePreflightCheck";
import {
  getAndroidPreflightRequirements,
  type AndroidPreflightCheckId,
  type AndroidPreflightRequirements,
} from "./androidPreflightRequirements";
import {
  retryPreflightCheck,
  successPreflightResult,
  type DiscoveryPreflightChecks,
  type DiscoveryPreflightResult,
} from "../preflightResult";

type PreflightRetry = () => Promise<true | MobileDiscoveryError>;

type AndroidPreflightCheckRunner = {
  run(requirements: AndroidPreflightRequirements): Promise<DiscoveryPreflightResult>;
};

type AndroidPreflightCheckFactory = (
  retry: PreflightRetry,
) => Record<AndroidPreflightCheckId, AndroidPreflightCheckRunner>;

const createDefaultChecks: AndroidPreflightCheckFactory = retry => ({
  "bluetooth-permission": new AndroidBluetoothPermissionPreflightCheck(retry),
  "bluetooth-service": new AndroidBluetoothServicePreflightCheck(retry),
  "location-permission": new AndroidLocationPermissionPreflightCheck(retry),
  "location-service": new AndroidLocationServicePreflightCheck(retry),
});

export class AndroidBleDiscoveryPreflightChecks implements DiscoveryPreflightChecks {
  constructor(
    private readonly makeChecks = createDefaultChecks,
    private readonly getRequirements = getAndroidPreflightRequirements,
  ) {}

  async getPreflight(): Promise<DiscoveryPreflightResult> {
    const requirements = this.getRequirements();
    /**
     * If one of the checks fails, we retry the entire chain so that it moves on to the next check
     * and so on until all checks are completed or one fails.
     */
    const retry = () => retryPreflightCheck(() => this.getPreflight());
    const checks = this.makeChecks(retry);

    for (const check of requirements.checks) {
      const result = await checks[check].run(requirements);

      if (!result.success) {
        return result;
      }
    }

    return successPreflightResult;
  }
}
