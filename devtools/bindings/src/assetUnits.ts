import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";

type Dispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/** An amount in the unit's display form, or the raw amount when the unit is not known. */
export const formatAmount = (unit: Unit | undefined, amount: string) =>
  unit
    ? formatCurrencyUnit(unit, new BigNumber(amount), { showCode: true, disableRounding: true })
    : amount;

/** The currency of each asset: coins from the registry, tokens from CAL as they resolve. */
export function useAssetCurrencies(assetIds: readonly string[], dispatch: Dispatch) {
  const [tokens, setTokens] = useState<Record<string, CryptoOrTokenCurrency>>({});

  const tokenIds = useMemo(
    () => assetIds.filter(id => !CRYPTO_CURRENCIES_REGISTRY[id] && !tokens[id]),
    [assetIds, tokens],
  );

  useEffect(() => {
    const queries = tokenIds.map(id => {
      const query = dispatch(cryptoAssetsApi.endpoints.findTokenById.initiate({ id }));
      query
        .unwrap()
        .then(token => {
          if (token) setTokens(known => ({ ...known, [id]: token }));
        })
        .catch(() => undefined);
      return query;
    });
    return () => queries.forEach(query => query.unsubscribe());
  }, [tokenIds, dispatch]);

  return useCallback(
    (assetId: string): CryptoOrTokenCurrency | undefined =>
      CRYPTO_CURRENCIES_REGISTRY[assetId] ?? tokens[assetId],
    [tokens],
  );
}

/** The default unit of each asset, as its currency resolves. */
export function useAssetUnits(assetIds: readonly string[], dispatch: Dispatch) {
  const currencyOf = useAssetCurrencies(assetIds, dispatch);
  return useCallback(
    (assetId: string): Unit | undefined => currencyOf(assetId)?.units[0],
    [currencyOf],
  );
}
