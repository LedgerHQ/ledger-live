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
  getNftInfosPayload(params: GetNftInformationsParams): Promise<string>;
  getSetPluginPayload(params: GetSetPluginPayloadParams): Promise<string>;
}
