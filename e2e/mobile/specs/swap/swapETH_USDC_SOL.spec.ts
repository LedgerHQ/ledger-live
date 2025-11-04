import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDC_1, Account.SOL_1, "45", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2831"], ["@NanoSP", "@LNS", "@NanoX", "@Stax"]);
