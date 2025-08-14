import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near");
runDelegateTest(delegation, ["B2CQA-2741"]);
