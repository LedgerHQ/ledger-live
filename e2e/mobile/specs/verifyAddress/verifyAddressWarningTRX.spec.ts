import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressWarningTest } from "@e2e/specs/verifyAddress/verifyAddressWarning";

runVerifyAddressWarningTest({
  account: Account.TRX_1,
  expectedWarningMessage:
    "Send only tokens from Tron network. Sending from another network may result in permanent loss of your tokens.",
  tmsLinks: ["B2CQA-2699"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
});
