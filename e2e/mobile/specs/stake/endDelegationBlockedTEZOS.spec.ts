import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runUnstakeRequiredTezos } from "./stake";

// XTZ_2 (index 1) is DELEGATED + STAKED: stopping delegation is blocked until the user unstakes first.
const delegation = new Delegate(Account.XTZ_2, "N/A", "Ledger by Kiln");
runUnstakeRequiredTezos(delegation, "stopDelegation", ["B2CQA-5921"]);
