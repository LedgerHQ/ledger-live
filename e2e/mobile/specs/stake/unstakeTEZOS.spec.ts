import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runUnstakeTezos } from "./stake";

// XTZ_3 (index 2): dedicated DELEGATED + STAKED account for unstake, separate from stake's XTZ_2 to avoid a settlement race.
const delegation = new Delegate(Account.XTZ_3, "0.005", "Ledger by Kiln");
runUnstakeTezos(delegation, ["B2CQA-5918"]);
