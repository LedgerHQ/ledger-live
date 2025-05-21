import { runDelegateTezos } from "./delegate";

const delegation = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
runDelegateTezos(delegation, ["B2CQA-3041"]);
