import { addTokens, convertERC20 } from "@ledgerhq/cryptoassets/tokens";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmAPI } from "./api";

export const preload =
  (evmAPI: EvmAPI) =>
  async (currency: CryptoCurrency): Promise<ERC20Token[]> => {
    const erc20 = await evmAPI.fetchERC20Tokens({ currency });
    addTokens(erc20.map(convertERC20));
    return erc20;
  };

export function hydrate(value: ERC20Token[] | null | undefined): void {
  if (!Array.isArray(value)) return;
  addTokens(value.map(convertERC20));
  log("evm/preload", "hydrate " + value.length + " tokens");
}
