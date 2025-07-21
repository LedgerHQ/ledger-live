import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDC_1, Account.ETH_1, "65", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2830"], ["@NanoSP", "@LNS", "@NanoX"]);
