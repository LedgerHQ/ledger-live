import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";

export const formatAmount = (unit: Unit | undefined, amount: string) =>
  unit
    ? formatCurrencyUnit(unit, new BigNumber(amount), { showCode: true, disableRounding: true })
    : amount;

/** The default unit of each asset: coins from the registry, tokens from CAL as they resolve. */
export function useAssetUnits(
  assetIds: readonly string[],
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>,
) {
  const [tokenUnits, setTokenUnits] = useState<Record<string, Unit>>({});

  const tokenIds = useMemo(
    () => assetIds.filter(id => !CRYPTO_CURRENCIES_REGISTRY[id] && !tokenUnits[id]),
    [assetIds, tokenUnits],
  );

  useEffect(() => {
    const queries = tokenIds.map(id => {
      const query = dispatch(cryptoAssetsApi.endpoints.findTokenById.initiate({ id }));
      query
        .unwrap()
        .then(token => {
          if (token) setTokenUnits(units => ({ ...units, [id]: token.units[0] }));
        })
        .catch(() => undefined);
      return query;
    });
    return () => queries.forEach(query => query.unsubscribe());
  }, [tokenIds, dispatch]);

  return useCallback(
    (assetId: string): Unit | undefined =>
      CRYPTO_CURRENCIES_REGISTRY[assetId]?.units[0] ?? tokenUnits[assetId],
    [tokenUnits],
  );
}
