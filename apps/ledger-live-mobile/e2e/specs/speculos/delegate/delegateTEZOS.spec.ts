import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTezos } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
runDelegateTezos(delegation, ["B2CQA-3041"]);
