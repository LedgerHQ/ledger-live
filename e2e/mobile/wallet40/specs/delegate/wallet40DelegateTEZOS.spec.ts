import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTezos } from "./delegate";

const delegation = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
runDelegateTezos(delegation, ["B2CQA-3041"]);
