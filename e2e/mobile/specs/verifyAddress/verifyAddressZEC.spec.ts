import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.ZEC_1,
  ["B2CQA-6605"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@zcash", "@family-bitcoin"],
);
