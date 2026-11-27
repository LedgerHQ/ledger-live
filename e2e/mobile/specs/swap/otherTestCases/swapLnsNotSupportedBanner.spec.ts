import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapLnsNotSupportedBannerTest } from "@e2e/specs/swap/otherTestCases/swap.other";

runSwapLnsNotSupportedBannerTest({
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  unsupportedProvider: SwapProvider.LIFI,
  tmsLinks: ["B2CQA-3389"],
  tags: ["@LNS", "@ethereum", "@family-evm"],
});
