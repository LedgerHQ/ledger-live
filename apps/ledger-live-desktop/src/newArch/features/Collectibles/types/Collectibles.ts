import { ProtoNFT, NFT, Account } from "@ledgerhq/types-live";
import { CollectibleTypeEnum } from "./enum/Collectibles";

export type CollectibleType =
  | CollectibleTypeEnum.NFT
  | CollectibleTypeEnum.Ordinal
  | CollectibleTypeEnum.RareSat
  | CollectibleTypeEnum.Inscriptions;

export type BaseNftsProps = {
  nfts: (ProtoNFT | NFT)[];
  account: Account;
};

export type Status = "error" | "success" | "pending";
