import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";
runVerifyAddressTest({
  account: Account.BSC_1,
  tmsLinks: ["B2CQA-2686", "B2CQA-2696"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
});
