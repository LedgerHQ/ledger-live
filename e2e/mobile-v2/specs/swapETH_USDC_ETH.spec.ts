import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e-mobile/specs/swap.test";

runSwapTest(
  TokenAccount.ETH_USDC_1,
  Account.ETH_1,
  ["B2CQA-2830"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
