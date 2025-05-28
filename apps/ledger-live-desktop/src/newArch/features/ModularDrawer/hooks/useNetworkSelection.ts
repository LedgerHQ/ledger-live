import { useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useNetworkSelection() {
  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();
  return {
    networksToDisplay,
    setNetworksToDisplay,
  };
}
