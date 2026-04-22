import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressWarningTest } from "./verifyAddressWarning";

runVerifyAddressWarningTest(
  Account.ETH_1,
  ["B2CQA-2697"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
