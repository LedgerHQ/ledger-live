import { Account } from "@ledgerhq/types-live";

export type NftsDetailDrawerProps = {
  account: Account;
  tokenId: string;
  isOpened: boolean;
  setIsOpened: (isOpened: boolean) => void;
};

export type NftComponentData = {
  collectionName: string | null | undefined;
  nftName: string | null | undefined;
  tokenId: string;
  contentType: string;
  imageUri: string;
  useFallback: boolean;
  mediaType: string;
  setUseFallback: () => void;
  closeCollectiblesPanAndZoom: () => void;
};
