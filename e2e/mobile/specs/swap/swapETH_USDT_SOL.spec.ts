import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDT_1, Account.SOL_1, "60", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2751"], ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"]);
