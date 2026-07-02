import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(
  Account.XRP_1,
  ["B2CQA-2566", "B2CQA-2692"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
);
