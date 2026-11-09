import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { isAppAllowedInPlaceOfAccountApp } from "@ledgerhq/live-common/wallet-api/helpers";

/**
 * Apps the device must have installed to raw-sign with `appName`. The account's own app, which
 * also keeps its plugins up to date, is required unless the live app names an app allowed to sign
 * for the account's currency in its place (e.g. an app derived from the Bitcoin app), which does
 * not need the account's app.
 */
export function getConnectAppDependencies(
  currency: CryptoCurrency | undefined,
  appName: string | undefined,
  dependencies: string[] | undefined,
): AppRequest[] {
  if (currency === undefined) return dependenciesToAppRequests(dependencies);
  const signsInPlaceOfAccountApp = isAppAllowedInPlaceOfAccountApp(currency, appName);
  return [
    ...(signsInPlaceOfAccountApp ? [] : [{ currency }]),
    ...dependenciesToAppRequests(dependencies),
  ];
}
