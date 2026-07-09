import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runEarningChoiceTezos } from "./stake";

// XTZ_4 (index 3) is funded + UNDELEGATED: with the staking flag on, Earn opens the earning-choice chooser.
// (idx0/XTZ_1 is used by the legacy Tezos delegation spec, so the earning-choice flow has its own account.)
const delegation = new Delegate(Account.XTZ_4, "N/A", "Ledger by Kiln");
runEarningChoiceTezos(delegation, ["B2CQA-5915"]);
