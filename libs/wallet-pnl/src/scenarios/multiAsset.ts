import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BTC, ETH, USDC, USD, SAT, WEI, USDC_UNIT } from "./currencies";
import { makeAccount, makeAccountWithTokens, makeTokenAccount } from "./accounts";
import { buy, sell } from "./operations";
import { buildMultiCV } from "./countervalues";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

export type MultiAssetScenario = {
  btcAccount: Account;
  ethAccount: Account;
  usdcAccount: TokenAccount;
  countervalues: CounterValuesState;
};

export type NestedSubAccountScenario = {
  ethWithUsdc: Account;
  usdcSub: TokenAccount;
  countervalues: CounterValuesState;
};

/**
 * Multi-asset portfolio — three positions across two account kinds (Account + TokenAccount).
 *
 * BTC (`btcAccount`): 4 monthly buys of 0.1 BTC (Jan–Apr 2025, $40k → $55k)
 *   + 1 sell of 0.1 BTC on 2025-06-01 at $65k. Final balance 0.3 BTC.
 *
 * ETH (`ethAccount`): 2 buys of 5 ETH ($2000 then $2500) + 1 sell of 2 ETH
 *   at $3000. Final balance 8 ETH.
 *
 * USDC (`usdcAccount`, token under `ethAccount`): 1 buy of 1000 USDC at $1,
 *   no sells. Final balance 1000 USDC; PnL should be ~0 since latest = entry.
 *
 * Counter-values: historical rates per pair + per-pair `latest` (BTC $70k,
 * ETH $3200, USDC $1).
 *
 * Stresses `computePortfolioPnL`: the returned totals MUST equal the
 * elementwise sum of `computeAssetPnL` across the 3 accounts, across both
 * crypto and token account types.
 *
 * Intentionally exposes no pre-computed `expected.*` — tests assert
 * portfolio = Σ asset on the fly to avoid duplicating the impl's math.
 */
export function buildMultiAssetScenario(): MultiAssetScenario {
  const btcOps = [
    buy(SAT.times("0.1"), new Date(Date.UTC(2025, 0, 15))),
    buy(SAT.times("0.1"), new Date(Date.UTC(2025, 1, 15))),
    buy(SAT.times("0.1"), new Date(Date.UTC(2025, 2, 15))),
    buy(SAT.times("0.1"), new Date(Date.UTC(2025, 3, 15))),
    sell(SAT.times("0.1"), new Date(Date.UTC(2025, 5, 1))),
  ];
  const btcAccount = makeAccount(BTC, {
    id: "js:2:bitcoin:btc-account:",
    operations: btcOps,
    balance: SAT.times("0.3"),
  });

  const ethOps = [
    buy(WEI.times(5), new Date(Date.UTC(2025, 0, 10))),
    buy(WEI.times(5), new Date(Date.UTC(2025, 2, 10))),
    sell(WEI.times(2), new Date(Date.UTC(2025, 5, 10))),
  ];
  const ethAccount = makeAccount(ETH, {
    id: "js:2:ethereum:eth-account:",
    operations: ethOps,
    balance: WEI.times(8),
  });

  const usdcOps = [buy(USDC_UNIT.times(1000), new Date(Date.UTC(2025, 1, 1)))];
  const usdcAccount = makeTokenAccount(USDC, {
    id: "js:2:ethereum:eth-account:+ethereum/erc20/usd_coin",
    parentId: "js:2:ethereum:eth-account:",
    operations: usdcOps,
    balance: USDC_UNIT.times(1000),
  });

  const countervalues = buildMultiCV([
    {
      pair: { from: BTC, to: USD },
      history: {
        "2025-01-15": 40000,
        "2025-02-15": 45000,
        "2025-03-15": 50000,
        "2025-04-15": 55000,
        "2025-06-01": 65000,
      },
      latest: 70000,
    },
    {
      pair: { from: ETH, to: USD },
      history: {
        "2025-01-10": 2000,
        "2025-03-10": 2500,
        "2025-06-10": 3000,
      },
      latest: 3200,
    },
    {
      pair: { from: USDC, to: USD },
      history: {
        "2025-02-01": 1,
      },
      latest: 1,
    },
  ]);

  return { btcAccount, ethAccount, usdcAccount, countervalues };
}

/**
 * Nested-sub-account variant — a single top-level `Account` (ETH) carrying
 * one `TokenAccount` (USDC) under its `subAccounts`. Both positions have
 * non-zero ops and balances.
 *
 * Used to assert that `computePortfolioPnL` flattens sub-accounts the same
 * way `getPortfolio` from `@ledgerhq/live-countervalues` does — i.e. an ETH
 * account passed alone must contribute BOTH its own PnL AND its USDC
 * sub-account's PnL to the totals.
 */
export function buildNestedSubAccountScenario(): NestedSubAccountScenario {
  const ethBuyDate = new Date(Date.UTC(2025, 0, 10));
  const usdcBuyDate = new Date(Date.UTC(2025, 1, 1));

  const usdcSub = makeTokenAccount(USDC, {
    id: "js:2:ethereum:eth-nested-account:+ethereum/erc20/usd_coin",
    parentId: "js:2:ethereum:eth-nested-account:",
    operations: [buy(USDC_UNIT.times(500), usdcBuyDate)],
    balance: USDC_UNIT.times(500),
  });

  const ethWithUsdc = makeAccountWithTokens(ETH, [usdcSub], {
    id: "js:2:ethereum:eth-nested-account:",
    operations: [buy(WEI.times(2), ethBuyDate)],
    balance: WEI.times(2),
  });

  const countervalues = buildMultiCV([
    {
      pair: { from: ETH, to: USD },
      history: { "2025-01-10": 2000 },
      latest: 3000,
    },
    {
      pair: { from: USDC, to: USD },
      history: { "2025-02-01": 1 },
      latest: 1,
    },
  ]);

  return { ethWithUsdc, usdcSub, countervalues };
}
