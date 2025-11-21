import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export enum TokensDataTags {
  Tokens = "Tokens",
}

/**
 * Parameters for the getTokensData query
 *
 * @param networkFamily - Filter by network families (e.g., "ethereum", "polygon")
 * @param isStaging - Use staging or production environment
 * @param pageSize - Number of items per page (default: 1000, options: 10, 100, 1000)
 * @param output - Specify output fields (default: all fields, values: id, name, ticker, units, delisted)
 * @param limit - Maximum number of assets to return
 * @param ref - Reference to the source of the data Default: "branch:main"  Examples:
 *   - ref=branch:main - Main branch HEAD
 *   - ref=tag:tokens-1.11.12 - specific tag
 *   - ref=commit:48188c6ca2888a9c50a0466d2442ec2f24cc2852 - specific commit
 *   - CAL reference to use
 */
export interface GetTokensDataParams {
  networkFamily?: string;
  output?: string[];
  limit?: number;
  pageSize?: number;
  ref?: string;
  isStaging?: boolean;
}

export interface PageParam {
  cursor?: string;
}

export interface TokensDataWithPagination {
  tokens: TokenCurrency[];
  pagination: {
    nextCursor?: string;
  };
}
