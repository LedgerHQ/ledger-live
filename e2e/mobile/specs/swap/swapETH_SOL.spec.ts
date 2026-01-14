import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_1, Account.SOL_1, "0.018", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2748"], ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"]);
