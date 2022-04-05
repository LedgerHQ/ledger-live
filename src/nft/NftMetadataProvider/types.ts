import { NFTMetadataResponse } from "../../types";

export type NFTResourceQueued = {
  status: "queued";
};

export type NFTResourceLoading = {
  status: "loading";
};

export type NFTResourceLoaded = {
  status: "loaded";
  metadata: NFTMetadataResponse["result"];
  updatedAt: number;
};

export type NFTResourceError = {
  status: "error";
  error: any;
  updatedAt: number;
};

export type NFTResourceNoData = {
  status: "nodata";
  updatedAt: number;
};

export type NFTResource =
  | NFTResourceQueued
  | NFTResourceLoading
  | NFTResourceLoaded
  | NFTResourceError
  | NFTResourceNoData;

export type NFTMetadataContextState = {
  cache: Record<string, NFTResource>;
};

export type NFTMetadataContextAPI = {
  loadNFTMetadata: (
    contract: string,
    tokenId: string,
    currencyId: string
  ) => Promise<void>;
  clearCache: () => void;
};

export type NFTMetadataContextType = NFTMetadataContextState &
  NFTMetadataContextAPI;

export type Batcher = {
  load: ({
    contract,
    tokenId,
  }: {
    contract: string;
    tokenId: string;
  }) => Promise<NFTMetadataResponse>;
};

export type BatchElement = {
  couple: {
    contract: string;
    tokenId: string;
  };
  resolve: (value: NFTMetadataResponse) => void;
  reject: (reason?: Error) => void;
};

export type Batch = {
  couples: Array<BatchElement["couple"]>;
  resolvers: Array<BatchElement["resolve"]>;
  rejecters: Array<BatchElement["reject"]>;
};
