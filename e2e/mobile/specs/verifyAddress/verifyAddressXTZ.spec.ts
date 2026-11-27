import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest({
  account: Account.XTZ_1,
  tmsLinks: ["B2CQA-2564", "B2CQA-2695"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tezos", "@family-tezos"],
});
