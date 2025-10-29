import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "40", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2753"], ["@NanoSP", "@LNS", "@NanoX", "@Stax"]);
