import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment");
runDelegateTest(delegation, "B2CQA-3022");
