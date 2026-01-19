import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(Account.ATOM_1, ["B2CQA-2560", "B2CQA-2694"]);
