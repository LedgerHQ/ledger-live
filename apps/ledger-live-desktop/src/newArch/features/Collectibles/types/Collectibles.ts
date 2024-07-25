import { ProtoNFT, NFT, Account } from "@ledgerhq/types-live";
import { CollectibleTypeEnum } from "./enum/Collectibles";

export type CollectibleType = CollectibleTypeEnum.NFT | CollectibleTypeEnum.Ordinal;

export type BaseNftsProps = {
  nfts: (ProtoNFT | NFT)[];
  account: Account;
};
