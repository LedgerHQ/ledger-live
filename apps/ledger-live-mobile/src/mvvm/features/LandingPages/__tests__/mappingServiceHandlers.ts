import { http, HttpResponse } from "msw";
import type { MappedAsset } from "@ledgerhq/live-common/deposit/type";

const mappedAsset = (
  ledgerId: string,
  providerId: string,
  ticker: string,
  name: string,
  type: MappedAsset["$type"] = "Coin",
): MappedAsset => ({
  $type: type,
  ledgerId,
  providerId,
  name,
  ticker,
  status: "ok",
  reason: null,
  data: {
    img: "",
    marketCapRank: null,
  },
});

const mappedAssets: MappedAsset[] = [
  mappedAsset("bitcoin", "bitcoin", "BTC", "Bitcoin"),
  mappedAsset("ethereum", "ethereum", "ETH", "Ethereum"),
  mappedAsset("solana", "solana", "SOL", "Solana"),
  mappedAsset("ethereum/erc20/usd__coin", "usd-coin", "USDC", "USD Coin", "Token"),
];

export const mappingServiceHandlers = [
  http.get("https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets", () =>
    HttpResponse.json(mappedAssets),
  ),
];
