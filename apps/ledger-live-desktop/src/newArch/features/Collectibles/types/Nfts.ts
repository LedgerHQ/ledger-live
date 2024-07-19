import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { DropDownItemType } from "~/renderer/components/DropDownSelector";

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
  isLoading: boolean;
  setUseFallback: () => void;
  closeCollectiblesPanAndZoom: () => void;
};

export type NftBreadcrumbProps = {
  activeItem: DropDownItemType<ProtoNFT>;
  items: DropDownItemType<ProtoNFT>[];
  collectionAddress: string | undefined;
  onCollectionSelected: (item: DropDownItemType<ProtoNFT>) => void;
  onSeeAll: () => void;
};
