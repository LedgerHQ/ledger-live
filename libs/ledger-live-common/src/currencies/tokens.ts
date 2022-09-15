import { convertERC20, addTokens } from "@ledgerhq/cryptoassets";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import network from "../network";
import { log } from "@ledgerhq/logs";
import { getEnv } from "../env";

export const fetchERC20Tokens = async () => {
  let tokens: TokenCurrency[];

  try {
    const { data } = await network({ url: getEnv("DYNAMIC_CAL_ERC_20_URL") });

    tokens = data.map(convertERC20);
  } catch (e: any) {
    log("preload-erc20", `failed to preload erc20 ${e.toString()}`);
    tokens = [];
  }

  return tokens;
};

export const preloadTokens = async () => {
  addTokens(await fetchERC20Tokens());
};
