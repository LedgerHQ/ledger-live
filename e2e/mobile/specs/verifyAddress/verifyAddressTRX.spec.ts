import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(Account.TRX_1, ["B2CQA-2565", "B2CQA-2690"]);
