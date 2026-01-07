import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.02", Fee.MEDIUM);
runSwapTest(
  swap,
  ["B2CQA-2750", "B2CQA-3135"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
);
