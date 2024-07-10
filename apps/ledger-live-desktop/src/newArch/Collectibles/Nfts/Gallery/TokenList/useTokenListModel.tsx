import { Account } from "@ledgerhq/types-live";

type TokenListModel = {
  account: Account;
  collectibles: {
    id: string;
    previewUri: string;
  }[];
};

export const useTokenListModel = (): TokenListModel => {
  return {
    account: 2,
    collectibles: 2,
  };
};
