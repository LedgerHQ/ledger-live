import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { pickDefaultDepositAccount } from "./defaultAccount";

const ethereum = {
  type: "CryptoCurrency",
  id: "ethereum",
  ticker: "ETH",
  units: [{ magnitude: 18 }],
};
const bitcoin = { type: "CryptoCurrency", id: "bitcoin", ticker: "BTC", units: [{ magnitude: 8 }] };

const token = (id: string, ticker: string, magnitude: number) => ({
  type: "TokenCurrency",
  id,
  ticker,
  units: [{ magnitude }],
});
const arbitrumUsdc = token("arbitrum/erc20/usd_coin", "USDC", 6);
const ethereumUsdc = token("ethereum/erc20/usd__coin", "USDC", 6);
const bscUsdt = token("bsc/bep20/binance-peg_bsc-usd", "USDT", 18);
const dai = token("ethereum/erc20/dai_stablecoin_v2_0", "DAI", 18);

const tokenAccount = (id: string, currency: object, balance: string): AccountLike =>
  ({
    type: "TokenAccount",
    id,
    token: currency,
    spendableBalance: new BigNumber(balance),
  }) as unknown as AccountLike;

const account = (id: string, currency: object, balance: string): AccountLike =>
  ({
    type: "Account",
    id,
    currency,
    spendableBalance: new BigNumber(balance),
  }) as unknown as AccountLike;

const fiat: Record<string, number> = {
  "eth-1": 3000,
  "btc-1": 9000,
  "dai-1": 50_000,
};
const getFiatBalance = (acc: AccountLike) =>
  fiat[acc.id] === undefined ? undefined : new BigNumber(fiat[acc.id] ?? 0);
const isEligible = () => true;

describe("pickDefaultDepositAccount", () => {
  it("is not restricted to native Arbitrum USDC", () => {
    const smallArbitrumUsdc = tokenAccount("arb-usdc", arbitrumUsdc, "5000000"); // 5 USDC
    const largeEthereumUsdc = tokenAccount("eth-usdc", ethereumUsdc, "800000000"); // 800 USDC

    expect(
      pickDefaultDepositAccount({
        accounts: [smallArbitrumUsdc, largeEthereumUsdc],
        isEligible,
        getFiatBalance,
      }),
    ).toBe(largeEthereumUsdc);
  });

  it("compares USDC and USDT by their decimal-normalised balance, not raw units", () => {
    const usdc = tokenAccount("arb-usdc", arbitrumUsdc, "300000000"); // 300 USDC, 6 decimals
    const usdt = tokenAccount("bsc-usdt", bscUsdt, "200000000000000000000"); // 200 USDT, 18 decimals

    expect(pickDefaultDepositAccount({ accounts: [usdt, usdc], isEligible, getFiatBalance })).toBe(
      usdc,
    );
  });

  it("prefers a USDC or USDT account over a larger non-stablecoin balance", () => {
    const usdt = tokenAccount("bsc-usdt", bscUsdt, "10000000000000000000"); // 10 USDT
    const btc = account("btc-1", bitcoin, "100000000");
    const daiAccount = tokenAccount("dai-1", dai, "50000000000000000000000");

    expect(
      pickDefaultDepositAccount({ accounts: [btc, daiAccount, usdt], isEligible, getFiatBalance }),
    ).toBe(usdt);
  });

  it("falls back to the account with the highest fiat balance when no USDC or USDT is held", () => {
    const eth = account("eth-1", ethereum, "1000000000000000000");
    const btc = account("btc-1", bitcoin, "100000000");

    expect(pickDefaultDepositAccount({ accounts: [eth, btc], isEligible, getFiatBalance })).toBe(
      btc,
    );
  });

  it("treats an unpriced account as zero in the fallback", () => {
    const unpriced = account("sol-1", { ...ethereum, id: "solana", ticker: "SOL" }, "1");
    const eth = account("eth-1", ethereum, "1000000000000000000");

    expect(
      pickDefaultDepositAccount({ accounts: [unpriced, eth], isEligible, getFiatBalance }),
    ).toBe(eth);
  });

  it("skips empty and ineligible accounts, stablecoins included", () => {
    const emptyUsdc = tokenAccount("arb-usdc", arbitrumUsdc, "0");
    const blockedUsdt = tokenAccount("bsc-usdt", bscUsdt, "10000000000000000000");
    const eth = account("eth-1", ethereum, "1000000000000000000");

    expect(
      pickDefaultDepositAccount({
        accounts: [emptyUsdc, blockedUsdt, eth],
        isEligible: acc => acc.id !== "bsc-usdt",
        getFiatBalance,
      }),
    ).toBe(eth);
  });

  it("returns undefined when no account is eligible", () => {
    expect(
      pickDefaultDepositAccount({
        accounts: [tokenAccount("arb-usdc", arbitrumUsdc, "0")],
        isEligible,
        getFiatBalance,
      }),
    ).toBeUndefined();
    expect(pickDefaultDepositAccount({ accounts: [], isEligible, getFiatBalance })).toBeUndefined();
  });
});
