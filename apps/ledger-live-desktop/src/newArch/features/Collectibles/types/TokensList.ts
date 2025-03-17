import { Account, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type TokensListProps = {
  account: Account;
  formattedNfts: {
    id: string;
    metadata: NFTMetadata | null | undefined;
    nft: ProtoNFT | undefined;
    collectibleId: string;
    standard: string;
    amount: string | BigNumber;
    tokenName: string;
    previewUri: string;
    isLoading: boolean;
    mediaType: string;
  }[];
  isDrawerOpen: boolean;
  nftIdToOpen: string | null;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
  onItemClick: (id: string) => void;
};
