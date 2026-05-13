import type { FlowName } from "../../../device-action/utils";
import {
  resolveAppRequestRequirements,
  toEnsureAppReadyInput,
} from "../../../hw/deviceInitialization/helpers/resolveAppRequestRequirements";
import type { AppRequestInput, EnsureAppReadyInput } from "./types";
import { buildExpectedAccountIdentity } from "../../../hw/deviceInitialization/helpers/wrongDeviceValidation";

export type BuildEnsureAppReadyInputParams = {
  appRequest: AppRequestInput;
  flow?: FlowName;
  currencyName?: string;
  skipWrongDeviceCheck?: boolean;
};

/**
 * Build the `EnsureAppReadyInput` consumed by DIE from the
 * same `AppRequestInput` shape historically passed to legacy connect-app flows.
 *
 * Use this when migrating a flow from `hw/actions/app` / `connectApp` to
 * `DeviceIntentExecutor`:
 * - keep building the same `AppRequestInput`
 * - pass it to `buildEnsureAppReadyInput(...)`
 * - pass the returned object unchanged as `input`
 *
 * Callers should not manually derive `appName`, `dependencies`,
 * `requiresDerivation`, `expectedAccount`, or `deprecation`. This builder is
 * the canonical translation boundary from rich domain input to DIE init input.
 */
export async function buildEnsureAppReadyInput(
  params: BuildEnsureAppReadyInputParams,
): Promise<EnsureAppReadyInput> {
  const resolved = await resolveAppRequestRequirements(params.appRequest);
  const baseInput = toEnsureAppReadyInput(resolved);

  const expectedAccount =
    !params.skipWrongDeviceCheck && params.appRequest.account
      ? buildExpectedAccountIdentity(params.appRequest.account)
      : undefined;

  const derivedCurrencyName =
    params.currencyName ??
    params.appRequest.tokenCurrency?.name ??
    params.appRequest.account?.currency?.name ??
    params.appRequest.currency?.name;

  const deprecation =
    params.flow && derivedCurrencyName
      ? {
          flow: params.flow,
          currencyName: derivedCurrencyName,
        }
      : undefined;

  return {
    ...baseInput,
    expectedAccount,
    deprecation,
  };
}
