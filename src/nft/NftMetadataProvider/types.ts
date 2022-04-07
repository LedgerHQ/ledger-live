import {
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
} from "../../types";

export type NFTResourceQueued = {
  status: "queued";
};

export type NFTResourceLoading = {
  status: "loading";
};

export type NFTResourceLoaded = {
  status: "loaded";
  metadata:
    | NFTMetadataResponse["result"]
    | NFTCollectionMetadataResponse["result"];
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
  loadCollectionMetadata: (
    contract: string,
    currencyId: string
  ) => Promise<void>;
  clearCache: () => void;
};

export type NFTMetadataContextType = NFTMetadataContextState &
  NFTMetadataContextAPI;

export type Batcher = {
  load: (
    element:
      | {
          contract: string;
          tokenId: string;
        }
      | {
          contract: string;
        }
  ) => Promise<NFTMetadataResponse | NFTCollectionMetadataResponse>;
};

export type BatchElement = {
  element: any;
  resolve: (value: NFTMetadataResponse) => void;
  reject: (reason?: Error) => void;
};

export type Batch = {
  elements: Array<BatchElement["element"]>;
  resolvers: Array<BatchElement["resolve"]>;
  rejecters: Array<BatchElement["reject"]>;
};
