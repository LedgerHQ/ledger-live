import { runDelegateCelo } from "./delegate";

const delegation = new Delegate(Account.CELO_1, "0.001", "N/A");
runDelegateCelo(delegation, ["B2CQA-3042"]);
