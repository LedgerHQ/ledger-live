import { useCallback, useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BAANX_ASSET_LEDGER_IDS } from "@domain/entity-card-asset-mapping";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Currency } from "@ledgerhq/ledger-wallet-framework/types";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import type { CardFormatters } from "@features/flow-pay-card";

type PricedCurrency = CryptoCurrency | TokenCurrency;

const TOKEN_LEDGER_IDS = [
  ...new Set(
    Object.values(BAANX_ASSET_LEDGER_IDS).filter(
      (id): id is string => id !== undefined && id.includes("/"),
    ),
  ),
];

export function useCardWalletCounterValue(): NonNullable<
  CardFormatters["resolveWalletCounterValue"]
> {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const [tokens, setTokens] = useState<ReadonlyMap<string, TokenCurrency>>(() => new Map());

  useEffect(() => {
    let cancelled = false;

    void Promise.all(TOKEN_LEDGER_IDS.map(id => getCryptoAssetsStore().findTokenById(id))).then(
      results => {
        if (cancelled) return;
        const next = new Map<string, TokenCurrency>();
        TOKEN_LEDGER_IDS.forEach((id, index) => {
          const token = results[index];
          if (token) next.set(id, token as TokenCurrency);
        });
        setTokens(next);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return useCallback(
    (wallet, balance) => {
      const ledgerId = wallet.ledgerId;
      if (!ledgerId) return null;
      const currency: PricedCurrency | undefined =
        findCryptoCurrencyById(ledgerId) ?? tokens.get(ledgerId);
      if (!currency) return null;
      const parsed = new BigNumber(balance);
      if (!parsed.isFinite()) return null;
      const value = valueFromUnit(parsed, currency.units[0]);
      const fiat = calculateCountervalue(currency as Currency, value);
      if (fiat == null || !fiat.isFinite()) return null;
      return fiat.toNumber();
    },
    [calculateCountervalue, tokens],
  );
}
