import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger");
runDelegateTest(delegation, ["B2CQA-2740", "B2CQA-2770"]);
