import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger");
runDelegateTest(delegation, ["B2CQA-2740", "B2CQA-2770"]);
