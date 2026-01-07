import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(Account.SOL_1, ["B2CQA-2563", "B2CQA-2689"]);
