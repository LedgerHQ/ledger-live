import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "tests/fixtures/common";
import { runCliCommandWithRetry } from "tests/utils/runCli";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { type MonitorEntry, unit, groupByApp } from "./config";
import { buildCliCmd, parseCliOutput } from "./cli";
import type { AccountResult } from "./types";

const monitored: MonitorEntry[] = [
  { account: Account.BTC_LEGACY_1, threshold: "5000", ...unit("bitcoin") }, // 0.00005 BTC
  { account: Account.BTC_NATIVE_SEGWIT_1, threshold: "70300", ...unit("bitcoin") }, // 0.000703 BTC
  { account: Account.BTC_SEGWIT_1, threshold: "1000", ...unit("bitcoin") }, // 0.00001 BTC
  { account: Account.BTC_TAPROOT_1, threshold: "1000", ...unit("bitcoin") }, // 0.00001 BTC
  { account: Account.ETH_1, threshold: "25000000000000000", ...unit("ethereum") }, // 0.025 ETH
  { account: Account.ETH_3, threshold: "5000000000000000", ...unit("ethereum") }, // 0.005 ETH
  {
    account: Account.ETH_1,
    threshold: "56000000",
    tokenId: "ethereum/erc20/usd__coin",
    name: "USDC (Ethereum 1)",
    decimals: 6,
    ticker: "USDC",
  }, // 56 USDC
  {
    account: Account.ETH_1,
    threshold: "56000000",
    tokenId: "ethereum/erc20/usd_tether__erc20_",
    name: "USDT (Ethereum 1)",
    decimals: 6,
    ticker: "USDT",
  }, // 56 USDT
  {
    account: Account.ETH_2,
    threshold: "50000000",
    tokenId: "ethereum/erc20/usd_tether__erc20_",
    name: "USDT (Ethereum 2)",
    decimals: 6,
    ticker: "USDT",
  }, // 50 USDT
  { account: Account.SOL_1, threshold: "700000000", ...unit("solana") }, // 0.7 SOL
  { account: Account.SOL_2, threshold: "100000000", ...unit("solana") }, // 0.1 SOL
  {
    account: Account.SOL_1,
    threshold: "500000",
    tokenId: "solana/spl/gigachad_63lfdmnb3mq8mw9mtz2to9bea2m71kzuugq5tijxcqj9",
    name: "GIGA (Solana 1)",
    decimals: 5,
    ticker: "GIGA",
  }, // 5 GIGA
  {
    account: Account.SOL_1,
    threshold: "1000000",
    tokenId: "solana/spl/ekpqgsjtjmfqkz9kqansqyxrcf8fbopzlhyxdm65zcjm",
    name: "WIF (Solana 1)",
    decimals: 6,
    ticker: "WIF",
  }, // 1 WIF
  { account: Account.XRP_1, threshold: "40000000", ...unit("ripple") }, // 40 XRP
  { account: Account.DOGE_1, threshold: "10000000", ...unit("dogecoin") }, // 0.1 DOGE
  { account: Account.TRX_1, threshold: "1100000", ...unit("tron") }, // 1.1 TRX
  { account: Account.BASE_1, threshold: "100000000000000", ...unit("base") }, // 0.0001 ETH
  { account: Account.ADA_1, threshold: "4000000", ...unit("cardano") }, // 4 ADA
  { account: Account.ALGO_1, threshold: "5000000", ...unit("algorand") }, // 5 ALGO
  {
    account: Account.ALGO_1,
    threshold: "50000",
    tokenId: "algorand/asa/312769",
    name: "USDT (Algorand 1)",
    decimals: 6,
    ticker: "USDT",
  }, // 0.05 USDT
  { account: Account.APTOS_1, threshold: "200000000", ...unit("aptos") }, // 2 APT
  { account: Account.BCH_1, threshold: "100000", ...unit("bitcoin_cash") }, // 0.001 BCH
  { account: Account.CELO_1, threshold: "630000000000000000000", ...unit("celo") }, // 630 CELO
  { account: Account.ATOM_1, threshold: "50000", ...unit("cosmos") }, // 0.05 ATOM
  { account: Account.ATOM_2, threshold: "50000", ...unit("cosmos") }, // 0.05 ATOM
  { account: Account.DOT_1, threshold: "30000000000", ...unit("assethub_polkadot") }, // 3 DOT
  { account: Account.HEDERA_1, threshold: "58000000000", ...unit("hedera") }, // 580 HBAR
  { account: Account.ICP_1, threshold: "50000000", ...unit("internet_computer") }, // 0.5 ICP
  { account: Account.INJ_1, threshold: "200000000000000000", ...unit("injective") }, // 0.2 INJ
  { account: Account.KASPA_1, threshold: "200000000", ...unit("kaspa") }, // 2 KASPA
  { account: Account.MULTIVERS_X_1, threshold: "1200000000000000000", ...unit("elrond") }, // 1.2 EGLD
  { account: Account.NEAR_1, threshold: "1000000000000000000000000", ...unit("near") }, // 1 NEAR
  { account: Account.NEAR_2, threshold: "500000000000000000000000", ...unit("near") }, // 0.5 NEAR
  { account: Account.OSMO_1, threshold: "1000000", ...unit("osmo") }, // 1 OSMO
  { account: Account.POL_1, threshold: "5000000000000000000", ...unit("polygon") }, // 5 POL
  {
    account: Account.POL_1,
    threshold: "3000000000000000000",
    tokenId: "polygon/erc20/(pos)_dai_stablecoin",
    name: "DAI (Polygon 1)",
    decimals: 18,
    ticker: "DAI",
  }, // 3 DAI
  { account: Account.SUI_1, threshold: "2000000000", ...unit("sui") }, // 2 SUI
  {
    account: Account.SUI_1,
    threshold: "10000000",
    tokenId:
      "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc",
    name: "USDC (Sui 1)",
    decimals: 6,
    ticker: "USDC",
  }, // 10 USDC
  { account: Account.VET_1, threshold: "50000000000", ...unit("vechain") }, // 500 VET
  { account: Account.XLM_1, threshold: "1000000000", ...unit("stellar") }, // 100 XLM
  { account: Account.XTZ_1, threshold: "5000000", ...unit("tezos") }, // 5 XTZ
  { account: Account.ZEC_1, threshold: "1500000", ...unit("zcash") }, // 0.015 ZEC
];

const artifactsDir = resolve(__dirname, "../../artifacts");

for (const [appName, entries] of groupByApp(monitored)) {
  test.describe(`Fund Monitor — ${appName}`, () => {
    test.use({ speculosApp: entries[0].account.currency.speculosApp });

    test(
      `Check balances [${appName}]`,
      { tag: ["@fund-monitor"] },
      async ({ speculos: _speculos }) => {
        const results: AccountResult[] = [];

        for (const { account, threshold, tokenId, name, decimals, ticker } of entries) {
          let balance = "0";
          let freshAddress = "";
          let error: string | undefined;

          try {
            const output = await runCliCommandWithRetry(buildCliCmd(account));
            const parsed = parseCliOutput(output, tokenId);
            if (parsed) {
              balance = parsed.balance;
              freshAddress = parsed.freshAddress;
            } else {
              error = "Could not parse CLI output";
            }
          } catch (e) {
            error = (e as Error).message.slice(0, 200);
          }

          results.push({
            name: name ?? account.accountName,
            currency: tokenId ?? account.currency.id,
            balance,
            threshold,
            freshAddress,
            isLow: !error && BigInt(balance) < BigInt(threshold),
            decimals,
            ticker,
            ...(error ? { error } : {}),
          });
        }

        mkdirSync(artifactsDir, { recursive: true });
        const safeAppName = appName
          .toLowerCase()
          .replaceAll(/\s+/g, "-")
          .replaceAll(/[^a-z0-9-]/g, "");
        writeFileSync(
          resolve(artifactsDir, `fund-monitor-partial-${safeAppName}.json`),
          JSON.stringify(results, null, 2),
        );
      },
    );
  });
}
