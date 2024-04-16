import { NftSpamReportOpts } from "@ledgerhq/live-nft/api/simplehash";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { ProtoNFT } from "@ledgerhq/types-live";
import { UseInfiniteQueryResult, InfiniteData, UseMutationResult } from "@tanstack/react-query";

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
  SimpleHashResponse,
  Error,
  NftSpamReportOpts,
  unknown
>;
