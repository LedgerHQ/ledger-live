import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";
//TODO: re-enable test when https://ledgerhq.atlassian.net/browse/LIVE-25852 is fixed
runVerifyAddressTest(
  Account.BSC_1,
  ["B2CQA-2686", "B2CQA-2696"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
);
