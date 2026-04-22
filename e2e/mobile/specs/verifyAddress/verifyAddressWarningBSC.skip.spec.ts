import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressWarningTest } from "./verifyAddressWarning";

// TODO: re-enable this spec when LIVE-25852 is fixed.
runVerifyAddressWarningTest(
  Account.BSC_1,
  ["B2CQA-2698"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
  { skip: true },
);
