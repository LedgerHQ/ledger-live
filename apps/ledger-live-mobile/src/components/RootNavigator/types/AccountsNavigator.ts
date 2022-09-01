import { ProtoNFT } from "@ledgerhq/types-live";
import { StackScreenProps } from "@react-navigation/stack";
import { ScreenName } from "../../../const";

export type AccountsNavigatorParamList = {
  [ScreenName.Accounts]: { currency?: string; search?: string } | undefined;
  [ScreenName.AccountReadOnly]: {
    currencyId: string;
    currencyType: "CryptoCurrency" | "TokenCurrency";
  };
  [ScreenName.Account]: {
    accountId: string;
    parentId?: string;
  };
  [ScreenName.NftCollection]: {
    accountId: string;
    collection: ProtoNFT[];
  };
  [ScreenName.NftGallery]?: {
    accountId: string;
  };
  [ScreenName.NftViewer]: {
    nft: ProtoNFT;
  };
};

export type AccountsNavigatorScreenProps<
  RouteName extends keyof AccountsNavigatorParamList,
> = StackScreenProps<AccountsNavigatorParamList, RouteName>;
