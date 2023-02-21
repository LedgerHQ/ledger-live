import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { FloorPrice, ProtoNFT } from "@ledgerhq/types-live";
import { getEnv } from "../env";
import network from "../network";

const FLOOR_PRICE_CURRENCIES = new Set(["ethereum"]);

export const getFloorPrice = async (
  nft: ProtoNFT,
  currency: CryptoCurrency
): Promise<FloorPrice | null> => {
  if (!FLOOR_PRICE_CURRENCIES.has(nft.currencyId)) {
    return null;
  }

  try {
    const { data } = await network({
      method: "GET",
      url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v1/marketdata/${
        nft.currencyId
      }/${currency?.ethereumLikeInfo?.chainId}/contract/${
        nft.contract
      }/floor-price`,
    });

    return data;
  } catch (err: any) {
    return null;
  }
};
