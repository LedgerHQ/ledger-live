import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_USDT_1, "0.0006", Fee.MEDIUM);
runSwapTest(swap, ["B2CQA-2746"]);
