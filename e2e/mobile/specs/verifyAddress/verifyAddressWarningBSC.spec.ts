import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressWarningTest } from "./verifyAddressWarning";

runVerifyAddressWarningTest(
  Account.BSC_1,
  "Send only tokens from BNB Chain network. Sending from another network may result in permanent loss of your tokens.",
  ["B2CQA-2698"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
);
