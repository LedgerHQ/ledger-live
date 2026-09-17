import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { SwapLandingPageConfig } from "@e2e/specs/swap/otherTestCases/swap.other";

// Shared by the lumen and legacy card specs: the pinned preset is the only difference
// between them, so keeping the accounts, TMS links and tags here stops the two drifting.
export const swapLandingPageConfig: SwapLandingPageConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  tmsLinks: ["B2CQA-2918", "B2CQA-2327", "B2CQA-3080"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};
