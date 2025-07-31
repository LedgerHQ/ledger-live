import { log } from "@ledgerhq/logs";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const fetchERC20Tokens: (
  currency: CryptoCurrency,
) => Promise<ERC20Token[] | null> = async currency => {
  return null;
};

export async function preload(currency: CryptoCurrency): Promise<ERC20Token[] | undefined> {
  const erc20 = await fetchERC20Tokens(currency);
  if (!erc20) return;

  log("evm/preload", "preload " + erc20.length + " tokens");

  return erc20;
}

export function hydrate(value: unknown, currency: CryptoCurrency): void {
  if (!Array.isArray(value)) {
    return;
  }

  log("evm/preload", `hydrate ${value.length} tokens`);
  return;
}
