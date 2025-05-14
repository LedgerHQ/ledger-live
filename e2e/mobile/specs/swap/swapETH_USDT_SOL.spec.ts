import { runSwapTest } from "./swap";

const swap = new Swap(Account.ETH_USDT_1, Account.SOL_1, "60", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2751"]);
