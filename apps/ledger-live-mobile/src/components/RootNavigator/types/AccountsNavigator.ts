import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, ProtoNFT } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AccountsNavigatorParamList = {
  [ScreenName.Accounts]:
    | {
        currency?: string;
        search?: string;
        address?: string;
        currencyTicker?: string;
        currencyId?: string;
      }
    | undefined;
  [ScreenName.Account]: {
    account?: AccountLike;
    accountId?: string;
    parentId?: string;
    currencyId?: string;
    currencyType?: "CryptoCurrency" | "TokenCurrency";
  };
  [ScreenName.NftCollection]: {
    accountId: string;
    collection: ProtoNFT[];
  };
  [ScreenName.NftGallery]?: {
    title?: string;
    accountId: string;
  };
  [ScreenName.NftViewer]: {
    nft: ProtoNFT;
  };
  [ScreenName.Assets]: undefined;
  [ScreenName.Asset]: {
    currency: CryptoOrTokenCurrency;
  };
  [ScreenName.AccountsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean;
    canAddAccount?: boolean;
    isSyncEnabled?: boolean;
  };
};
