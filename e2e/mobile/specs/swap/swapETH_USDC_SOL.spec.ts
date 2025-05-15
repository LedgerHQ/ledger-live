import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_USDC_1, Account.SOL_1, "45", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2831"]);
