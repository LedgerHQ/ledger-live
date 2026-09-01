import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runMinaUndelegateTest } from "@e2e/specs/delegate/delegate";

// Undelegating returns the whole balance, so the flow carries no amount either.
const delegation = new Delegate(Account.MINA_1, "N/A", "Kraken");
runMinaUndelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@mina`, `@family-mina`],
);
