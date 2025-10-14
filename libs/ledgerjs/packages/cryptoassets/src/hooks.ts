import { useState, useEffect } from "react";
import { legacyCryptoAssetsStore } from "./legacy/legacy-store";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * CryptoAssetsHooks is the hooks interface version of the CryptoAssetsStore
 * This work provide a common interface for the hooks, and the backend implementation will be completed in the future
 * See https://github.com/LedgerHQ/ledger-live/pull/11951
 */
export function createCryptoAssetsHooks(
  config: {
    useCALBackend?: false; // at the moment, we only support legacy
    api?: unknown; // placeholder for the future
  } = {},
): Hooks {
  if (config.useCALBackend) {
    throw new Error("backend is not supported yet");
  } else {
    return {
      useTokenById: useLegacyTokenById,
      useTokenByAddressInCurrency: useLegacyTokenByAddressInCurrency,
    };
  }
}

type TokenResult = {
  token: TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

type Hooks = {
  useTokenById: (id: string) => TokenResult;
  useTokenByAddressInCurrency: (address: string, currencyId: string) => TokenResult;
};

/////////// Legacy hooks using legacyCryptoAssetsStore ///////////

function useLegacyTokenById(id: string) {
  const [token, setToken] = useState<TokenCurrency | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    if (!id) {
      setToken(undefined);
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const result = await legacyCryptoAssetsStore.findTokenById(id);
        setToken(result);
      } catch (err) {
        setError(err);
        setToken(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [id]);

  return { token, loading, error };
}

function useLegacyTokenByAddressInCurrency(address: string, currencyId: string) {
  const [token, setToken] = useState<TokenCurrency | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    if (!address || !currencyId) {
      setToken(undefined);
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const result = await legacyCryptoAssetsStore.findTokenByAddressInCurrency(
          address,
          currencyId,
        );
        setToken(result);
      } catch (err) {
        setError(err);
        setToken(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [address, currencyId]);

  return { token, loading, error };
}
