import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { BITCOIN_SIGN_PSBT_ALLOWED_APPS } from "@ledgerhq/live-common/wallet-api/constants";

/**
 * Apps the device must have installed to raw-sign with `appName`. The account's own app is
 * required unless the live app names an app allowed to sign for the account's currency in its
 * place (e.g. an app derived from the Bitcoin app), which does not need the account's app.
 */
export function getConnectAppDependencies(
  currency: CryptoCurrency,
  appName: string | undefined,
  dependencies: string[] | undefined,
): AppRequest[] {
  const signsInPlaceOfAccountApp =
    appName !== undefined && (BITCOIN_SIGN_PSBT_ALLOWED_APPS[currency.id]?.has(appName) ?? false);
  return [
    ...(signsInPlaceOfAccountApp ? [] : [{ currency }]),
    ...dependenciesToAppRequests(dependencies),
  ];
}
