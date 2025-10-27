import { useState, useEffect } from "react";
import { legacyCryptoAssetsStore } from "./legacy/legacy-store";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "./currencies";
import { cryptoAssetsApi } from "./cal-client/state-manager/api";

/**
 * CryptoAssetsHooks is the hooks interface version of the CryptoAssetsStore
 * It provides a unified interface for the hooks, regardless of the backend used
 */
export function createCryptoAssetsHooks(
  config: {
    useCALBackend?: boolean;
  } = {},
): Hooks {
  if (config.useCALBackend) {
    return {
      useTokenById: (id: string) => {
        const result = cryptoAssetsApi.useFindTokenByIdQuery({ id });
        return {
          token: result.data,
          loading: result.isLoading,
          error: result.error,
        };
      },
      useTokenByAddressInCurrency: (address: string, currencyId: string) => {
        const result = cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery({
          contract_address: address,
          network: currencyId,
        });
        return {
          token: result.data,
          loading: result.isLoading,
          error: result.error,
        };
      },
      useCurrencyById: (id: string) => {
        const maybeCryptoCurrency = findCryptoCurrencyById(id);
        if (maybeCryptoCurrency) {
          return {
            currency: maybeCryptoCurrency,
            loading: false,
            error: null,
          };
        }
        const result = cryptoAssetsApi.useFindTokenByIdQuery({ id });
        return {
          currency: result.data,
          loading: result.isLoading,
          error: result.error,
        };
      },
    };
  } else {
    return {
      useTokenById: useLegacyTokenById,
      useTokenByAddressInCurrency: useLegacyTokenByAddressInCurrency,
      useCurrencyById: useLegacyCurrencyById,
    };
  }
}

type TokenResult = {
  token: TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

type CurrencyResult = {
  currency: CryptoCurrency | TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

type Hooks = {
  useTokenById: (id: string) => TokenResult;
  useTokenByAddressInCurrency: (address: string, currencyId: string) => TokenResult;
  useCurrencyById: (id: string) => CurrencyResult;
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

function useLegacyCurrencyById(id: string) {
  const [currency, setCurrency] = useState<CryptoCurrency | TokenCurrency | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    if (!id) {
      setCurrency(undefined);
      setLoading(false);
      return;
    }

    const fetchCurrency = async () => {
      try {
        setLoading(true);
        setError(undefined);
        // First try to find as a crypto currency
        const cryptoCurrency = await Promise.resolve(findCryptoCurrencyById(id));
        const result = cryptoCurrency || (await legacyCryptoAssetsStore.findTokenById(id));
        setCurrency(result);
      } catch (err) {
        setError(err);
        setCurrency(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [id]);

  return { currency, loading, error };
}
