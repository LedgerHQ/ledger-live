import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment");
runDelegateTest(delegation, ["B2CQA-3022"]);
