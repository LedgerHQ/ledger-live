import { useState, useEffect } from "react";
import { legacyCryptoAssetsStore } from "./legacy/legacy-store";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsApi } from "./rtk-store/api";

/**
 * CryptoAssetsHooks is the hooks interface version of the CryptoAssetsStore
 * It provides a unified interface for the hooks, regardless of the backend used (as long as you pass in the configuration)
 */
export function createCryptoAssetsHooks(
  config: {
    useCALBackend?: boolean;
    api?: CryptoAssetsApi;
  } = {},
): Hooks {
  const { api } = config;
  if (config.useCALBackend && api) {
    return {
      useTokenById: (id: string) => {
        const result = api.useFindTokenByIdQuery({ id });
        return {
          token: result.data as TokenCurrency | undefined,
          loading: result.isLoading,
          error: result.error,
        };
      },
      useTokenByAddressInCurrency: (address: string, currencyId: string) => {
        const result = api.useFindTokenByAddressInCurrencyQuery({
          contract_address: address,
          network: currencyId,
        });
        return {
          token: result.data as TokenCurrency | undefined,
          loading: result.isLoading,
          error: result.error,
        };
      },
    };
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
