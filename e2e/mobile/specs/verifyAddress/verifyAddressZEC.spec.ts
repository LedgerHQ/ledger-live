import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

// TODO(LIVE-36495): replace with a real Xray ticket before merge.
runVerifyAddressTest(
  Account.ZEC_1,
  ["B2CQA-TODO"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@zcash", "@family-zcash"],
);
