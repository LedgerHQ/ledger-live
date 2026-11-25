import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.BABY_1, "0.001", "Figment");
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-6679"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@babylon`, `@family-cosmos`],
});
