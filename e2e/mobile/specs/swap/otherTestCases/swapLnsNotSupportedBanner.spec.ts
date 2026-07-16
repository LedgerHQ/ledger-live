import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapLnsNotSupportedBannerTest } from "./swap.other";

runSwapLnsNotSupportedBannerTest(
  Account.ETH_1,
  TokenAccount.ETH_USDT_1,
  SwapProvider.LIFI,
  ["B2CQA-3389"],
  ["@LNS", "@ethereum", "@family-evm"],
);
