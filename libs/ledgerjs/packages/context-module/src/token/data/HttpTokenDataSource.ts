import axios from "axios";
import { GetTokenInfosParams, TokenDataSource } from "./TokenDataSource";

export class HttpTokenDataSource implements TokenDataSource {
  public async getTokenInfosPayload({
    chainId,
    address,
  }: GetTokenInfosParams): Promise<string | undefined> {
    const response = await axios.request<[{ live_signature: string }]>({
      method: "GET",
      url: `https://crypto-assets-service.api.ledger.com/v1/tokens`,
      params: { contract_address: address, chain_id: chainId, output: "live_signature" },
    });

    if (!response.data?.[0]?.live_signature) {
      return;
    }

    return response.data[0].live_signature;
  }
}
