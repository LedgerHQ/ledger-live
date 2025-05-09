import { runSwapTest } from "./swap";

const swap = new Swap(Account.XRP_1, Account.ETH_USDC_1, "15", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-3075"]);
