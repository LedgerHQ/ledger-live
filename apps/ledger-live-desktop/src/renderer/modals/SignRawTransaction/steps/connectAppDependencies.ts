import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";

/**
 * Apps the device must have installed to raw-sign with `appName`. The account's own app, which
 * also keeps its plugins up to date, is only required when it is the app that signs: a live app
 * that names another app (e.g. an app derived from the Bitcoin app) does not need it installed.
 */
export function getConnectAppDependencies(
  currency: CryptoCurrency | undefined,
  appName: string | undefined,
  dependencies: string[] | undefined,
): AppRequest[] {
  const opensAccountApp =
    currency !== undefined && (appName === undefined || appName === currency.managerAppName);
  return [...(opensAccountApp ? [{ currency }] : []), ...dependenciesToAppRequests(dependencies)];
}
