import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.XRP_1, Account.BTC_NATIVE_SEGWIT_1, "15", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-3077"], ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"]);
