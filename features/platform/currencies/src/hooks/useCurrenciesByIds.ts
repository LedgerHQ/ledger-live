import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type CurrenciesById = ReadonlyMap<string, CryptoCurrency | TokenCurrency>;

/**
 * Resolves a list of Ledger ids to currency objects: coins from the static registry, the rest from
 * CAL. The CAL lookups are dispatched rather than hooked, so the list can be any length.
 */
export function useCurrenciesByIds(ids: readonly string[]): CurrenciesById {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [tokens, setTokens] = useState<ReadonlyMap<string, TokenCurrency>>(() => new Map());

  // Serialised so the effect and the memo depend on the ids themselves, not the array's identity.
  const key = JSON.stringify(ids);

  useEffect(() => {
    const tokenIds = [
      ...new Set(
        (JSON.parse(key) as string[]).filter(id => findCryptoCurrencyById(id) === undefined),
      ),
    ];
    if (tokenIds.length === 0) return;

    let live = true;
    const requests = tokenIds.map(id =>
      dispatch(cryptoAssetsApi.endpoints.findTokenById.initiate({ id })),
    );

    // Each id lands on its own: `findTokenById` retries, so waiting for all of them would withhold
    // the ones that already answered for the whole of another's backoff.
    for (const request of requests) {
      request
        .then(({ data }) => {
          if (!live || !data) return;
          setTokens(previous => new Map(previous).set(data.id, data));
        })
        .catch(() => {});
    }

    return () => {
      live = false;
      requests.forEach(request => request.unsubscribe());
    };
  }, [key, dispatch]);

  return useMemo(() => {
    const wanted = new Set(JSON.parse(key) as string[]);
    const byId = new Map<string, CryptoCurrency | TokenCurrency>();

    for (const id of wanted) {
      const coin = findCryptoCurrencyById(id);
      if (coin) byId.set(coin.id, coin);
    }
    // Filtered, so a token resolved for a previous `ids` cannot answer for one nobody asked about.
    for (const [id, token] of tokens) {
      if (wanted.has(id)) byId.set(id, token);
    }

    return byId;
  }, [key, tokens]);
}
