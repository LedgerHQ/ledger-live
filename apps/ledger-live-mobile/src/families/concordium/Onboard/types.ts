import { ScreenName } from "~/const";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type ConcordiumOnboardAccountParamList = {
  [ScreenName.ConcordiumOnboardAccount]: {
    accountsToAdd: Account[];
    currency: CryptoOrTokenCurrency;
  };
};
