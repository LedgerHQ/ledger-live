import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.SOL_1, "0.001", "Ledger by Figment");
runDelegateTest(delegation, "B2CQA-2742");
