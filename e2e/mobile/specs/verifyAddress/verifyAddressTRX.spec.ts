import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.TRX_1,
  ["B2CQA-2565"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);
