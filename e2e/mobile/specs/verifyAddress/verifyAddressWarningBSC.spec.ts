import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressWarningTest } from "@e2e/specs/verifyAddress/verifyAddressWarning";

runVerifyAddressWarningTest({
  account: Account.BSC_1,
  expectedWarningMessage:
    "Send only tokens from BNB Smart Chain network. Sending from another network may result in permanent loss of your tokens.",
  tmsLinks: ["B2CQA-2698"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
});
