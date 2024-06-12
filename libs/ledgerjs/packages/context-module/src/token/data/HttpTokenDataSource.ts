import axios from "axios";
import { GetTokenInfosParams, TokenDataSource } from "./TokenDataSource";
import { TokenDto } from "./TokenDto";
import PACKAGE from "../../../package.json";

export class HttpTokenDataSource implements TokenDataSource {
  public async getTokenInfosPayload({
    chainId,
    address,
  }: GetTokenInfosParams): Promise<string | undefined> {
    try {
      const response = await axios.request<TokenDto[]>({
        method: "GET",
        url: `https://crypto-assets-service.api.ledger.com/v1/tokens`,
        params: {
          contract_address: address,
          chain_id: chainId,
          output: "live_signature,ticker,decimals",
        },
        headers: { "X-Ledger-Client-Version": `context-module/${PACKAGE.version}` },
      });
      const tokenInfos = response.data?.[0];

      if (!tokenInfos || !tokenInfos.live_signature || !tokenInfos.ticker || !tokenInfos.decimals) {
        return;
      }

      // 1 byte for the length of the ticker
      const tickerLengthBuff = Buffer.alloc(1);
      tickerLengthBuff.writeUintBE(tokenInfos.ticker.length, 0, 1);

      // ticker ascii
      const tickerBuff = Buffer.from(tokenInfos.ticker);

      // bufferized address
      const addressBuff = Buffer.from(address.slice(2), "hex");

      // 4 bytes for the decimals
      const decimalsBuff = Buffer.alloc(4);
      decimalsBuff.writeUintBE(tokenInfos.decimals, 0, 4);

      // 4 bytes for the chainId
      const chainIdBuff = Buffer.alloc(4);
      chainIdBuff.writeUintBE(chainId, 0, 4);

      // bufferized live signature
      const liveSignatureBuff = Buffer.from(tokenInfos.live_signature, "hex");

      return Buffer.concat([
        tickerLengthBuff,
        tickerBuff,
        addressBuff,
        decimalsBuff,
        chainIdBuff,
        liveSignatureBuff,
      ]).toString("hex");
    } catch (error) {
      return;
    }
  }
}
