import { runSwapTest } from "./swap";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.00067", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2744", "B2CQA-2432"]);
