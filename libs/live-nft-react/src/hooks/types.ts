import { NftSpamReportOpts, RefreshOpts } from "@ledgerhq/live-nft/api/simplehash";
import {
  SimpleHashResponse,
  SimpleHashSpamReportResponse,
  SimpleHashRefreshResponse,
} from "@ledgerhq/live-nft/api/types";
import { ProtoNFT, FloorPrice } from "@ledgerhq/types-live";
import {
  UseInfiniteQueryResult,
  InfiniteData,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";

// SpamFilter
export type HookProps = {
  addresses: string;
  nftsOwned: ProtoNFT[];
  chains: string[];
  threshold: number;
  action?: (collection: string) => void;
  enabled?: boolean;
};

export type PartialProtoNFT = Partial<ProtoNFT>;

export type NftGalleryFilterResult = UseInfiniteQueryResult<
  InfiniteData<SimpleHashResponse, unknown>,
  Error
> & {
  nfts: ProtoNFT[];
};

export type NftsFilterResult = UseInfiniteQueryResult<
  InfiniteData<SimpleHashResponse, unknown>,
  Error
> & {
  nfts: ProtoNFT[];
};

// SpamReportNft
export type SpamReportNftResult = UseMutationResult<
  SimpleHashSpamReportResponse,
  Error,
  NftSpamReportOpts,
  unknown
>;

// FloorPrice
export type FloorPriceResult = UseQueryResult<FloorPrice, Error>;

// Refresh Metadata Contract or NFT
export type RefreshMetadataResult = UseMutationResult<
  SimpleHashRefreshResponse,
  Error,
  RefreshOpts,
  unknown
>;

// Check Spam Score Contract or NFT
export type CheckSpamScoreResult = UseQueryResult<SimpleHashResponse, Error>;

// Fetch Ordinals from SimpleHash
export enum OrdinalsChainsEnum {
  RARESATS = "utxo",
  INSCRIPTIONS = "bitcoin",
}
export type OrdinalsStandard = "raresats" | "inscriptions";
export type FetchNftsProps = {
  addresses: string;
  threshold: number;
};
export enum RareSatRarity {
  ALPHA = "alpha",
  BLACK_EPIC = "black_epic",
  BLACK_LEGENDARY = "black_legendary",
  BLACK_MYTHIC = "black_mythic",
  BLACK_RARE = "black_rare",
  BLACK_UNCOMMON = "black_uncommon",
  BLOCK_9 = "block_9",
  BLOCK_9_450X = "block_9_450x",
  BLOCK_78 = "block_78",
  BLOCK_286 = "block_286",
  BLOCK_666 = "block_666",
  COMMON = "common",
  EPIC = "epic",
  FIRST_TX = "first_tx",
  HITMAN = "hitman",
  JPEG = "jpeg",
  LEGACY = "legacy",
  LEGENDARY = "legendary",
  MYTHIC = "mythic",
  NAKAMOTO = "nakamoto",
  OMEGA = "omega",
  PALIBLOCK = "paliblock",
  PALINDROME = "palindrome",
  PALINCEPTION = "palinception",
  PIZZA = "pizza",
  RARE = "rare",
  UNCOMMON = "uncommon",
  VINTAGE = "vintage",
  LOW_SERIAL_NUMBER = "low_serial_number",
  SPECIAL_TRANSACTION = "special_transaction",
  COINBASE_REWARD = "coinbase_reward",
  DUST = "dust",
  UNIQUE_PATTERN = "unique_pattern",
  COLORED_COIN = "colored_coin",
  HISTORICAL_EVENT = "historical_event",
  NON_STANDARD_SCRIPT = "non_standard_script",
}
