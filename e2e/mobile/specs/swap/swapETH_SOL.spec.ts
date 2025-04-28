import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_1, Account.SOL_1, "0.018", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2748"]);
