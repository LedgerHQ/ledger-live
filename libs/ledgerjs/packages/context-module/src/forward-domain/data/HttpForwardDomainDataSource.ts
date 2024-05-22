import axios from "axios";
import { ForwardDomainDataSource, GetForwardDomainInfosParams } from "./ForwardDomainDataSource";

export class HttpForwardDomainDataSource implements ForwardDomainDataSource {
  public async getDomainNamePayload({
    domain,
    challenge,
  }: GetForwardDomainInfosParams): Promise<string> {
    const response = await axios.request<{ payload: string }>({
      method: "GET",
      url: `https://nft.api.live.ledger.com/v1/names/ens/forward/${domain}?challenge=${challenge}`,
    });

    return response.data.payload;
  }
}
