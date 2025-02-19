import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One");
runDelegateTest(delegation, ["B2CQA-3021"]);
