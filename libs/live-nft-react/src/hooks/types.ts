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
};

export type PartialProtoNFT = Partial<ProtoNFT>;

export type NftGalleryFilterResult = UseInfiniteQueryResult<
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
