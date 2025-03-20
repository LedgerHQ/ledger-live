import { runSwapTest } from "./swap";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const swap = new Swap(Account.ETH_USDC_1, Account.SOL_1, "45", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2831"]);
