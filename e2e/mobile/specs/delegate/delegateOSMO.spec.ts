import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.OSMO_1, "0.0001", "polkachu.com");
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-3022"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@osmo`, `@family-cosmos`],
});
