import { runSwapTest } from "./swap";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.00067", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2744", "B2CQA-2432"]);
