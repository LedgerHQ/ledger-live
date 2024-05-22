import axios from "axios";
import {
  GetNftInformationsParams,
  GetSetPluginPayloadParams,
  NftDataSource,
} from "./NftDataSource";

export class HttpNftDataSource implements NftDataSource {
  public async getSetPluginPayload({
    chainId,
    address,
    selector,
  }: GetSetPluginPayloadParams): Promise<string> {
    const response = await axios.request<{ payload: string }>({
      method: "GET",
      url: `https://nft.api.live.ledger.com/v1/ethereum/${chainId}/contracts/${address}/plugin-selector/${selector}`,
    });

    return response.data.payload;
  }

  public async getNftInfosPayload({ chainId, address }: GetNftInformationsParams) {
    const response = await axios.request<{ payload: string }>({
      method: "GET",
      url: `https://nft.api.live.ledger.com/v1/ethereum/${chainId}/contracts/${address}`,
    });

    return response.data.payload;
  }
}
