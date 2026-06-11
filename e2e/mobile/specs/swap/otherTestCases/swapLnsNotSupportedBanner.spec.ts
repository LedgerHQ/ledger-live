import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runSwapLnsNotSupportedBannerTest } from "./swap.other";

runSwapLnsNotSupportedBannerTest(
  Account.ETH_1,
  TokenAccount.ETH_USDT_1,
  SwapProvider.LIFI,
  ["B2CQA-3389"],
  ["@LNS", "@ethereum", "@family-evm"],
);
