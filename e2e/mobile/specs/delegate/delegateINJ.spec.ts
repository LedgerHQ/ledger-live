import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One");
runDelegateTest(delegation, ["B2CQA-3021"]);
