import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BEP20Token, ERC20Token } from "@ledgerhq/cryptoassets/types";
import { tokens as tokensByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import { addTokens, convertERC20, convertBEP20 } from "@ledgerhq/cryptoassets/tokens";

export const fetchERC20Tokens: (currency: CryptoCurrency) => Promise<ERC20Token[] | BEP20Token[]> =
  makeLRUCache(
    async currency => {
      const { ethereumLikeInfo } = currency;

      const url = `${getEnv("DYNAMIC_CAL_BASE_URL")}/evm/${
        ethereumLikeInfo?.chainId || 0
      }/erc20.json`;
      const dynamicTokens: ERC20Token[] | null = await network({
        method: "GET",
        url,
      })
        .then(({ data }: { data: ERC20Token[] }) => (data.length ? data : null))
        .catch(e => {
          log("error", "EVM Family: Couldn't fetch dynamic CAL tokens from " + url, e);
          return null;
        });
      if (dynamicTokens) return dynamicTokens;

      const tokens = tokensByChainId[
        ethereumLikeInfo?.chainId as keyof typeof tokensByChainId
      ] as ERC20Token[];
      if (tokens) return tokens;

      log("warning", `EVM Family: No tokens found in CAL for currency: ${currency.id}`, currency);
      return [];
    },
    currency => `erc20-tokens-${currency.id}`,
    {
      ttl: 6 * 60 * 60 * 1000, // 6 hours cache
    },
  );

export async function preload(currency: CryptoCurrency): Promise<ERC20Token[] | BEP20Token[]> {
  const erc20 = await fetchERC20Tokens(currency);
  if (currency.id === "bsc") {
    addTokens((erc20 as BEP20Token[]).map(convertBEP20));
    return erc20;
  }
  addTokens(erc20.map(convertERC20));
  return erc20;
}

export function hydrate(value: ERC20Token[] | null | undefined, currency: CryptoCurrency): void {
  if (!Array.isArray(value)) return;
  if (currency.id === "bsc") {
    addTokens((value as BEP20Token[]).map(convertBEP20));
    log("evm/preload", "hydrate " + value.length + " tokens");
    return;
  }
  addTokens(value.map(convertERC20));
  log("evm/preload", "hydrate " + value.length + " tokens");
}
