import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";

export const ethereum = getCryptoCurrencyById("ethereum");
export const usd = getFiatCurrencyByTicker("USD");
export const usdc = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: ethereum.id,
  contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
  ticker: "USDC",
  name: "USD Coin",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});
export const uni = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/uniswap",
  parentCurrencyId: ethereum.id,
  contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  tokenType: "erc20",
  ticker: "UNI",
  name: "Uniswap",
  units: [{ name: "Uniswap", code: "UNI", magnitude: 18 }],
});
export const payTabEthAccount = genAccount("pay-tab-eth", { currency: ethereum });
export const payTabUsdcAccount = genTokenAccount(0, payTabEthAccount, usdc);
export const payTabUniAccount = genTokenAccount(0, payTabEthAccount, uni);
