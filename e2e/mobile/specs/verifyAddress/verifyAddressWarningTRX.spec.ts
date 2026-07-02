import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressWarningTest } from "./verifyAddressWarning";

runVerifyAddressWarningTest(
  Account.TRX_1,
  "Send only tokens from Tron network. Sending from another network may result in permanent loss of your tokens.",
  ["B2CQA-2699"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);
