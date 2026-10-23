import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.SUI_1,
  ["B2CQA-6250"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
);
