import { runDelegateTest } from "./delegate";
import { setEnv } from "@ledgerhq/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment");
runDelegateTest(delegation, ["B2CQA-3020"]);
