import { ScreenName } from "~/const";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { NavigationSnapshot } from "../utils/navigationSnapshot";

type CantonOnboardParams = {
  accountsToAdd: Account[];
  currency: CryptoOrTokenCurrency;
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  restoreState?: NavigationSnapshot;
};

export type CantonOnboardAccountParamList = {
  [ScreenName.CantonDisclaimer]: CantonOnboardParams;
  [ScreenName.CantonOnboardAccount]: CantonOnboardParams;
};
