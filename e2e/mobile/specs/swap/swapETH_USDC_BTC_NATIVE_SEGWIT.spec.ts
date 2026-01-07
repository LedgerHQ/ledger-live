import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(TokenAccount.ETH_USDC_1, Account.BTC_NATIVE_SEGWIT_1, "65", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2832"], ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"]);
