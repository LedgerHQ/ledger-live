import { runSwapTest } from "./swap";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, TokenAccount.ETH_USDT_1, "0.0006", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2746"], ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"]);
