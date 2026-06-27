import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.ETH_1,
  TokenAccount.ETH_USDT_1,
  ["B2CQA-2749"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
