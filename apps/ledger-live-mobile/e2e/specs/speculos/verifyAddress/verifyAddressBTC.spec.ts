import { runVerifyAddressTest } from "./verifyAddress";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

runVerifyAddressTest(Account.BTC_NATIVE_SEGWIT_1, "B2CQA-2559, B2CQA-2687");
