import invariant from "invariant";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { loadAccountModuleForFamily } from "../../coin-modules/registry";
import type { ConnectAppRequest } from "../connectApp";
import type { AppRequestInput, ConnectAppInitializationInput, RequiresDerivation } from "./types";

export type ResolvedAppRequirements = {
  appName: string;
  dependencies?: string[];
  requireLatestFirmware?: boolean;
  allowPartialDependencies: boolean;
  requiresDerivation?: RequiresDerivation;
};

/**
 * Map between an AppRequest and a ConnectAppRequest, allowing us to
 * specify an account or a currency without resolving manually the actual
 * applications we depend on in order to access the flow.
 */
export async function resolveAppRequestRequirements(
  appRequest: AppRequestInput,
): Promise<ResolvedAppRequirements> {
  let derivationMode;
  let derivationPath;

  const {
    account,
    requireLatestFirmware,
    allowPartialDependencies = false,
    dependencies: appDependencies,
  } = appRequest;
  let { appName, currency } = appRequest;

  if (!currency && account) {
    currency = account.currency;
  }

  if (!appName && currency) {
    appName = currency.managerAppName;
  }

  invariant(appName, "appName or currency or account is missing");

  let dependencies: string[] | undefined = undefined;
  if (appDependencies) {
    dependencies = (await Promise.all(appDependencies.map(resolveAppRequestRequirements))).map(
      requirements => requirements.appName,
    );
  }

  if (!currency) {
    return {
      appName,
      dependencies,
      requireLatestFirmware,
      allowPartialDependencies,
    };
  }

  let extra;

  if (account) {
    derivationMode = account.derivationMode;
    derivationPath = account.freshAddressPath;
    const m = await loadAccountModuleForFamily(account.currency.family);

    if (m && m.injectGetAddressParams) {
      extra = m.injectGetAddressParams(account);
    }
  } else {
    const modes = getDerivationModesForCurrency(currency);
    derivationMode = modes[modes.length - 1];
    derivationPath = runDerivationScheme(
      getDerivationScheme({
        currency,
        derivationMode,
      }),
      currency,
    );
  }

  return {
    appName,
    dependencies,
    requireLatestFirmware,
    requiresDerivation: {
      derivationMode,
      path: derivationPath,
      currencyId: currency.id,
      ...extra,
    },
    allowPartialDependencies,
  };
}

export function toConnectAppRequest(requirements: ResolvedAppRequirements): ConnectAppRequest {
  return {
    appName: requirements.appName,
    dependencies: requirements.dependencies,
    requireLatestFirmware: requirements.requireLatestFirmware,
    allowPartialDependencies: requirements.allowPartialDependencies,
    requiresDerivation: requirements.requiresDerivation,
  };
}

export function toConnectAppInitializationInput(
  requirements: ResolvedAppRequirements,
): Omit<ConnectAppInitializationInput, "expectedAccount" | "deprecation"> {
  return {
    appName: requirements.appName,
    dependencies: requirements.dependencies ?? [],
    requireLatestFirmware: requirements.requireLatestFirmware ?? false,
    allowPartialDependencies: requirements.allowPartialDependencies,
    requiresDerivation: requirements.requiresDerivation,
  };
}
