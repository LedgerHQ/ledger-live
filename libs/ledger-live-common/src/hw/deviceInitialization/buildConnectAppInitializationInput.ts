import type { FlowName } from "../../device-action/utils";
import {
  resolveAppRequestRequirements,
  toConnectAppInitializationInput,
  toConnectAppRequest,
} from "./resolveAppRequestRequirements";
import type { AppRequestInput, ConnectAppInitializationInput } from "./types";
import { buildExpectedAccountIdentity } from "./wrongDeviceValidation";

export type BuildConnectAppInitializationParams = {
  appRequest: AppRequestInput;
  flow?: FlowName;
  currencyName?: string;
  skipWrongDeviceCheck?: boolean;
};

/**
 * Build the connect-app `deviceInitializationInput` consumed by DIE from the
 * same `AppRequestInput` shape historically passed to legacy connect-app flows.
 *
 * Use this when migrating a flow from `hw/actions/app` / `connectApp` to
 * `DeviceIntentExecutor`:
 * - keep building the same `AppRequestInput`
 * - pass it to `buildConnectAppInitializationInput(...)`
 * - pass the returned object unchanged as `deviceInitializationInput`
 *
 * Callers should not manually derive `appName`, `dependencies`,
 * `requiresDerivation`, `expectedAccount`, or `deprecation`. This builder is
 * the canonical translation boundary from rich domain input to DIE init input.
 */
export async function buildConnectAppInitializationInput(
  params: BuildConnectAppInitializationParams,
): Promise<ConnectAppInitializationInput> {
  const resolved = await resolveAppRequestRequirements(params.appRequest);
  const baseInput = toConnectAppInitializationInput(resolved);

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

export { resolveAppRequestRequirements, toConnectAppInitializationInput, toConnectAppRequest };
