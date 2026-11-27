import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate({
  account: Account.NEAR_1,
  amount: "0.01",
  provider: "ledgerbyfigment.poolv1.near",
});
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-2741"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@near", "@family-near"],
});
