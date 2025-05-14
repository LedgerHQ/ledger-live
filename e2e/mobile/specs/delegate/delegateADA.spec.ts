import { runDelegateTest } from "./delegate";
import { setEnv } from "@ledgerhq/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate(Account.ADA_1, "0.01", "LBF3 - Ledger by Figment 3");
runDelegateTest(delegation, ["B2CQA-3023"]);
