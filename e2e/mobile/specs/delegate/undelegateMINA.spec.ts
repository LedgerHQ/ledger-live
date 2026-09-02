import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runMinaUndelegateTest } from "@e2e/specs/delegate/delegate";

// Undelegating returns the whole balance, so the flow carries no amount either.
// A mina delegation is all-or-nothing on the whole balance, so one account cannot serve both
// flows: `Mina 2` stays delegated so this spec always has a position to open, while `Mina 1`
// stays undelegated for the delegate spec.
const delegation = new Delegate(Account.MINA_2, "N/A", "Kraken");
runMinaUndelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@mina`, `@family-mina`],
);
