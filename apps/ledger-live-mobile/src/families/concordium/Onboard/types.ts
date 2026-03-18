import { ScreenName } from "~/const";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type ConcordiumOnboardAccountParamList = {
  [ScreenName.ConcordiumOnboardAccount]: {
    accountsToAdd: Account[];
    currency: CryptoOrTokenCurrency;
  };
};
