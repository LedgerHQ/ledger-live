import type { ProtoNFT, FloorPrice } from "../types";
import { getEnv } from "../env";
import network from "../network";

const FLOOR_PRICE_CURRENCIES = new Set(["ethereum"]);

export const getFloorPrice = async (
  nft: ProtoNFT,
  chainId: string
): Promise<FloorPrice | null> => {
  if (!FLOOR_PRICE_CURRENCIES.has(nft.currencyId)) {
    return null;
  }

  const { data } = await network({
    method: "GET",
    url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v1/marketdata/${
      nft.currencyId
    }/${chainId}/contract/${nft.contract}/floor-price`,
  });

  return data;
};
