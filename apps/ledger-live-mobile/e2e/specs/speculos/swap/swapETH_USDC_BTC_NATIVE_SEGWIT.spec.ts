import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_USDC_1, Account.BTC_NATIVE_SEGWIT_1, "65", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2832"]);
