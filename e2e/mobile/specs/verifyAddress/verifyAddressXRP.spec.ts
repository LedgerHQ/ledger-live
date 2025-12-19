import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(Account.XRP_1, ["B2CQA-2566", "B2CQA-2692"]);
