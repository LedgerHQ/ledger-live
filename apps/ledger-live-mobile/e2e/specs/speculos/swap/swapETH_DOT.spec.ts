import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_1, Account.DOT_1, "0.02", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-3017"]);
