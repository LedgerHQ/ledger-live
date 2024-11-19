export type GetSetPluginPayloadParams = {
  chainId: number;
  address: string;
  selector: string;
};

export type GetNftInformationsParams = {
  chainId: number;
  address: string;
};

export interface NftDataSource {
  getNftInfosPayload(params: GetNftInformationsParams): Promise<string | undefined>;
  getSetPluginPayload(params: GetSetPluginPayloadParams): Promise<string | undefined>;
}
