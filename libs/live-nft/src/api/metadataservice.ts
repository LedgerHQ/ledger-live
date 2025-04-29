import network from "@ledgerhq/live-network/network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { FloorPrice, ProtoNFT } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";

const FLOOR_PRICE_CURRENCIES = new Set(["ethereum", "solana"]);
const SOLANA_CHAIN_ID = 101;

export const getFloorPrice = async (
  nft: ProtoNFT,
  currency: CryptoCurrency,
): Promise<FloorPrice | null> => {
  if (!FLOOR_PRICE_CURRENCIES.has(nft.currencyId)) {
    return null;
  }

  const chainId =
    nft.currencyId === "solana" ? SOLANA_CHAIN_ID : currency?.ethereumLikeInfo?.chainId;

  try {
    const { data } = await network({
      method: "GET",
      url: `${getEnv("NFT_METADATA_SERVICE")}/v2/marketdata/${nft.currencyId}/${chainId}/contract/${nft.contract}/floor-price`,
    });

    return data;
  } catch (err: any) {
    return null;
  }
};
