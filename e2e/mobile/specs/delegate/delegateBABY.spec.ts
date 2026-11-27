import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate({ account: Account.BABY_1, amount: "0.001", provider: "Figment" });
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-6679"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@babylon`, `@family-cosmos`],
});
