import { Account } from "@ledgerhq/types-live";

export type NftsDetailDrawerProps = {
  account: Account;
  tokenId: string;
  isOpened: boolean;
  setIsOpened: (isOpened: boolean) => void;
};
