import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.SOL_1, "0.001", "Ledger by Figment");
runDelegateTest(delegation, ["B2CQA-2742"]);
