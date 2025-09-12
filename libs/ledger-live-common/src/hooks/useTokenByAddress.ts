import { useState, useEffect } from "react";
import { getCryptoAssetsStore } from "../bridge/crypto-assets/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const useTokenByAddress = (tokenAddress: string | undefined, currencyId: string) => {
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setToken(null);
      return;
    }

    async function loadToken() {
      if (!tokenAddress) return; // Check again inside the function

      try {
        const foundToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
          tokenAddress,
          currencyId,
        );
        setToken(foundToken || null);
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
      }
    }
    loadToken();
  }, [tokenAddress, currencyId]);

  return token;
};
