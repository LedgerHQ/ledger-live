import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runMinaDelegateTest } from "@e2e/specs/delegate/delegate";

// Mina delegates the whole balance, so the flow carries no amount.
const delegation = new Delegate(Account.MINA_1, "N/A", "Kraken");
runMinaDelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@mina`, `@family-mina`],
);
