import { NFTCollectionMetadataResponse, NFTMetadataResponse } from "@ledgerhq/types-live";

type DefaultResource =
  | NonNullable<NFTMetadataResponse["result"]>
  | NonNullable<NFTCollectionMetadataResponse["result"]>;

export type NFTResourceQueued = {
  status: "queued";
  metadata?: null;
  updatedAt?: undefined;
};

type NFTOperation = {
  contract: string;
  currencyId: string;
};

export type NFTOperations = Record<string, NFTOperation>;

export type NFTResourceLoading = {
  status: "loading";
  metadata?: null;
  updatedAt?: undefined;
};

export type NFTResourceLoaded<T extends Record<string, unknown> = DefaultResource> = {
  status: "loaded";
  metadata: T;
  updatedAt: number;
};

export type NFTResourceError = {
  status: "error";
  error: any;
  updatedAt: number;
  metadata?: null;
};

export type NFTResourceNoData = {
  status: "nodata";
  updatedAt: number;
  metadata?: null;
};

export type NFTResource<T extends Record<string, unknown> = DefaultResource> =
  | NFTResourceQueued
  | NFTResourceLoading
  | NFTResourceLoaded<T>
  | NFTResourceError
  | NFTResourceNoData;

export type NFTMetadataContextState<T extends Record<string, unknown> = DefaultResource> = {
  cache: Record<string, NFTResource<T>>;
};

export type NFTMetadataContextAPI = {
  loadNFTMetadata: (contract: string, tokenId: string, currencyId: string) => Promise<void>;
  loadCollectionMetadata: (contract: string, currencyId: string) => Promise<void>;
  clearCache: () => void;
};

export type NFTMetadataContextType<T extends Record<string, unknown> = DefaultResource> =
  NFTMetadataContextState<T> & NFTMetadataContextAPI;

export type Batcher = {
  load: (
    element:
      | {
          contract: string;
          tokenId: string;
        }
      | {
          contract: string;
        },
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

export enum NftStatus {
  spam = "spam",
  notSpam = "notSpam",
  blacklisted = "blacklisted",
  whitelisted = "whitelisted",
}
