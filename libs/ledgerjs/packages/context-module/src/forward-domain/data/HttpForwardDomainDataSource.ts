import axios from "axios";
import { ForwardDomainDataSource, GetForwardDomainInfosParams } from "./ForwardDomainDataSource";
import PACKAGE from "../../../package.json";

export class HttpForwardDomainDataSource implements ForwardDomainDataSource {
  public async getDomainNamePayload({
    domain,
    challenge,
  }: GetForwardDomainInfosParams): Promise<string | undefined> {
    try {
      const response = await axios.request<{ payload: string }>({
        method: "GET",
        url: `https://nft.api.live.ledger.com/v1/names/ens/forward/${domain}?challenge=${challenge}`,
        headers: { "X-Ledger-Client-Version": `context-module/${PACKAGE.version}` },
      });

      return response.data.payload;
    } catch (error) {
      return;
    }
  }
}
