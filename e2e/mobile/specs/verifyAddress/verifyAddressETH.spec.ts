import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(Account.ETH_1, ["B2CQA-2561", "B2CQA-2688"]);
