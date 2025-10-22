import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDT_1, Account.ETH_1, "40", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2752", "B2CQA-2048"], ["@NanoSP", "@LNS", "@NanoX", "@Stax"]);
