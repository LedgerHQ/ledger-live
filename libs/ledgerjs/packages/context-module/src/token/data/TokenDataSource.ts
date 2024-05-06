export type GetTokenInfosParams = {
  address: string;
  chainId: number;
};

export interface TokenDataSource {
  getTokenInfosPayload(params: GetTokenInfosParams): Promise<string | undefined>;
}
