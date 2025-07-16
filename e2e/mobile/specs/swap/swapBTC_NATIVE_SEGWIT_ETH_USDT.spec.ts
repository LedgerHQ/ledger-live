import { runSwapTest } from "./swap";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_USDT_1, "0.0006", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2746"]);
