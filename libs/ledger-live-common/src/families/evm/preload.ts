import { log } from "@ledgerhq/logs";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { addTokens, convertERC20 } from "@ledgerhq/cryptoassets/tokens";
import { tokens as tokensByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import network from "../../network";
import { getEnv } from "../../env";

export const fetchERC20Tokens: (
  currency: CryptoCurrency
) => Promise<ERC20Token[]> = async (currency) => {
  const { ethereumLikeInfo } = currency;

  const url = `${getEnv("DYNAMIC_CAL_BASE_URL")}/evm/${
    ethereumLikeInfo?.chainId || 0
  }/erc20.json`;
  const dynamicTokens: ERC20Token[] | null = await network({
    method: "GET",
    url,
  })
    .then(({ data }: { data: ERC20Token[] }) => (data.length ? data : null))
    .catch((e) => {
      log(
        "error",
        "EVM Family: Couldn't fetch dynamic CAL tokens from " + url,
        e
      );
      return null;
    });
  if (dynamicTokens) return dynamicTokens;

  const tokens = tokensByChainId[ethereumLikeInfo?.chainId || ""];
  if (tokens) return tokens;

  log(
    "warning",
    `EVM Family: No tokens found in CAL for currency: ${currency.id}`,
    currency
  );
  return [];
};

export async function preload(currency: CryptoCurrency): Promise<ERC20Token[]> {
  const erc20 = await fetchERC20Tokens(currency);
  addTokens(erc20.map(convertERC20));
  return erc20;
}

export function hydrate(value: ERC20Token[] | null | undefined): void {
  if (!Array.isArray(value)) return;
  addTokens(value.map(convertERC20));
  log("evm/preload", "hydrate " + value.length + " tokens");
}
