import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "40", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2753"]);
