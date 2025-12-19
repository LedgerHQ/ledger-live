import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.SOL_2, "0.0001", "Ledger by Figment");
runDelegateTest(delegation, ["B2CQA-2742"]);
