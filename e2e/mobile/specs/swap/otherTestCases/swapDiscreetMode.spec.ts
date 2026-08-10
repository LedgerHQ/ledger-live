import { Account, type AccountType, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapDiscreetModeTest } from "./swap.other";

const fundedAssetsAccounts: AccountType[] = [
  Account.BTC_NATIVE_SEGWIT_1,
  Account.ETH_1,
  TokenAccount.ETH_USDC_1,
  TokenAccount.ETH_USDT_1,
];

const swapDiscreetModeTestConfig = {
  fundedAssetsAccounts,
  balanceCheckAccount: Account.ETH_1,
  tmsLinks: ["B2CQA-2457"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
};

runSwapDiscreetModeTest(
  swapDiscreetModeTestConfig.fundedAssetsAccounts,
  swapDiscreetModeTestConfig.balanceCheckAccount,
  swapDiscreetModeTestConfig.tmsLinks,
  swapDiscreetModeTestConfig.tags,
);
