import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { setHeliumPreloadData } from "../preloadedData";
import { getAccountShape } from "../utils";
import { fetchVoteData } from "../api/sdk-getVoteData";
import { HeliumVote } from "../types";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: async (currency: CryptoCurrency) => {
    const votes = await fetchVoteData(currency);
    setHeliumPreloadData({
      votes,
    });
    return Promise.resolve({
      votes,
    });
  },
  hydrate: (data: { votes?: HeliumVote[] }) => {
    if (!data || typeof data !== "object") return;
    const { votes } = data;

    setHeliumPreloadData({
      votes: votes ?? [],
    });
  },
  scanAccounts,
};
