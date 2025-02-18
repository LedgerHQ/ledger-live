import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { setEnv } from "@ledgerhq/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate(Account.ADA_1, "0.01", "LBF3 - Ledger by Figment 3");
runDelegateTest(delegation, "B2CQA-3023");
