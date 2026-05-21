import { ScreenName } from "~/const";

export type CryptoAddressesNavigator = {
  [ScreenName.CryptoAddresses]: {
    sourceScreenName: ScreenName;
    accountIds?: string[];
    hideAddAccount?: boolean;
  };
};
