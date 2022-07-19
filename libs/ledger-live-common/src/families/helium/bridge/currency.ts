import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { CryptoCurrency, CurrencyBridge } from "../../../types";
import { setHeliumPreloadData } from "../preloadedData";
import { getAccountShape } from "../utils";
import { getValidators } from "../api/sdk-getValidators";
import { fetchVoteData } from "../api/sdk-getVoteData";
import { Validator } from "@helium/http";
import { HeliumVote } from "../types";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: async (currency: CryptoCurrency) => {
    const validators = await getValidators(currency);
    const votes = await fetchVoteData(currency);
    setHeliumPreloadData({
      validators,
      votes,
    });
    return Promise.resolve({
      validators,
      votes,
    });
  },
  hydrate: (data: { validators?: Validator[]; votes?: HeliumVote[] }) => {
    if (!data || typeof data !== "object") return;
    const { validators, votes } = data;

    setHeliumPreloadData({
      validators: validators ?? [],
      votes: votes ?? [],
    });
  },
  scanAccounts,
};
