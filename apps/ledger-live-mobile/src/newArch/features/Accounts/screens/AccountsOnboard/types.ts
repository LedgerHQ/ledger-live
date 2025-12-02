import { ScreenName } from "~/const";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { NavigationSnapshot } from "~/families/canton/utils/navigationSnapshot";

export type AccountsOnboardParamList = {
  [ScreenName.AccountsOnboard]: {
    accountsToAdd: Account[];
    currency: CryptoOrTokenCurrency;
    isReonboarding?: boolean;
    accountToReonboard?: Account;
    restoreState?: NavigationSnapshot;
    editedNames?: { [accountId: string]: string };
  };
};
