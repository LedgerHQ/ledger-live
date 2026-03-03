import type { DistributionItem, AccountLike } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";

export const btc = cryptocurrenciesById["bitcoin"];
export const eth = cryptocurrenciesById["ethereum"];

export function makeToken(id: string, ticker: string, name: string, magnitude = 6): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: `0x${id.replace(/\//g, "")}`,
    parentCurrency: eth,
    tokenType: "erc20",
    name,
    ticker,
    units: [{ name, code: ticker, magnitude }],
  };
}

export function mockAccounts(...ids: string[]): AccountLike[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return ids.map(id => ({ id }) as AccountLike);
}

export function makeDistItem(
  currency: DistributionItem["currency"],
  overrides: Partial<Omit<DistributionItem, "currency">> = {},
): DistributionItem {
  return {
    distribution: 0,
    amount: 0,
    countervalue: 0,
    accounts: [],
    ...overrides,
    currency,
  };
}

// ── Token fixtures ──

export const usdcEth = makeToken("ethereum/erc20/usdc", "USDC", "USD Coin");
export const usdcArbitrum = makeToken("arbitrum/erc20/usdc", "USDC", "USD Coin (Arbitrum)");
export const usdcBase = makeToken("base/erc20/usdc", "USDC", "USD Coin (Base)");
export const usdtEth = makeToken("ethereum/erc20/usdt", "USDT", "Tether USD");
export const calEth = makeToken("ethereum/erc20/caldera", "CAL", "Caldera", 18);
export const calArbitrum = makeToken("arbitrum/erc20/caldera", "CAL", "Caldera (Arbitrum)", 18);
