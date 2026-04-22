import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressWarningTest } from "./verifyAddressWarning";

runVerifyAddressWarningTest(
  Account.TRX_1,
  ["B2CQA-2699"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);
