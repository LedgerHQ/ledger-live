import { useCallback } from "react";
import { CryptoCurrency, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { isCurrencySupported } from "../../currencies";
import { isSendDisabledForFamily, isReceiveDisabledForFamily } from "../../account/support";
import { ModularDrawerLocation } from "../enums";
import { useCurrenciesUnderFeatureFlag } from "./useCurrenciesUnderFeatureFlag";

type Options = {
  /**
   * Flow the drawer was opened for. In the send flow, families that cannot send (e.g. hypercore)
   * are rejected; in the receive flow, those that cannot receive. Everywhere else (add account,
   * live apps, market) nothing is filtered out.
   */
  flow?: string;
};

// Per-flow capability check. The send flow dispatches a bare "send" while receive uses the enum;
// SEND_FLOW is mapped too so that aligning the send opener on the enum later keeps working.
// Any other flow (add account, live apps, market) has no direction and filters nothing.
const DISABLED_FOR_FLOW: Record<string, (family: CryptoCurrency["family"]) => boolean> = {
  send: isSendDisabledForFamily,
  [ModularDrawerLocation.SEND_FLOW]: isSendDisabledForFamily,
  [ModularDrawerLocation.RECEIVE_FLOW]: isReceiveDisabledForFamily,
};

/**
 * Hook that returns a predicate function to check if a currency or token is accepted.
 * A currency is accepted if:
 * - It is supported by the platform (via isCurrencySupported)
 * - It is not deactivated by a feature flag
 * - Its family supports the direction of the flow it was opened from (send or receive)
 *
 * For tokens, the parent currency is checked instead.
 */
export function useAcceptedCurrency({ flow }: Options = {}) {
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const isDisabledForFlow = flow === undefined ? undefined : DISABLED_FOR_FLOW[flow];

  const isAcceptedCurrency = useCallback(
    (currencyOrToken: CryptoOrTokenCurrency): boolean => {
      const currency: CryptoCurrency =
        currencyOrToken.type === "TokenCurrency"
          ? getCryptoCurrencyById(currencyOrToken.parentCurrencyId)
          : currencyOrToken;

      if (isDisabledForFlow?.(currency.family)) return false;

      return isCurrencySupported(currency) && !deactivatedCurrencyIds.has(currency.id);
    },
    [deactivatedCurrencyIds, isDisabledForFlow],
  );

  return isAcceptedCurrency;
}
