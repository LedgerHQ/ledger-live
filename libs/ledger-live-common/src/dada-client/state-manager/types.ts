import { AssetsData } from "../entities";

export enum AssetsDataTags {
  Assets = "Assets",
}

export enum AssetsAdditionalData {
  Apy = "apy",
  MarketTrend = "marketTrend",
}

export interface GetAssetsDataParams {
  search?: string;
  currencyIds?: string[];
  useCase?: string;
  product: "llm" | "lld";
  version: string;
  isStaging?: boolean;
  additionalData?: AssetsAdditionalData[];
  includeTestNetworks?: boolean;
}

export interface PageParam {
  cursor?: string;
}

export interface AssetsDataWithPagination extends AssetsData {
  pagination: {
    nextCursor?: string;
  };
}
