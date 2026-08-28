import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest(
  TokenAccount.ETH_USDT_1,
  Account.ETH_1,
  ["B2CQA-2752", "B2CQA-2048"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
