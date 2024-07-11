import { ProtoNFT, NFT, Account } from "@ledgerhq/types-live";

export enum CollectibleTypeEnum {
  NFT = "NFT",
  Ordinal = "Ordinal",
}

export type CollectibleType = CollectibleTypeEnum.NFT | CollectibleTypeEnum.Ordinal;

export type BaseNftsProps = {
  nfts: (ProtoNFT | NFT)[];
  account: Account;
};
