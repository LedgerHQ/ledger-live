import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runEarningChoiceTezos } from "./stake";

// XTZ_1 (index 0) is funded + UNDELEGATED: with the staking flag on, Earn opens the earning-choice chooser.
const delegation = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
runEarningChoiceTezos(delegation, ["B2CQA-5915"]);
