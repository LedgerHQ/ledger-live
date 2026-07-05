import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runUnstakeTezos } from "./stake";

// XTZ_2 (index 1) is DELEGATED + STAKED: the account screen shows the staking section with the unstake action.
const delegation = new Delegate(Account.XTZ_2, "0.005", "Ledger by Kiln");
runUnstakeTezos(delegation, ["B2CQA-5918"]);
