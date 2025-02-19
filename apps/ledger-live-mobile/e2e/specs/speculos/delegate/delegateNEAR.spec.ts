import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near");
runDelegateTest(delegation, ["B2CQA-2741"]);
