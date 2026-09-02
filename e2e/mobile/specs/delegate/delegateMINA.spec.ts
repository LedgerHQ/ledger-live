import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runMinaDelegateTest } from "@e2e/specs/delegate/delegate";

// Mina delegates the whole balance, so the flow carries no amount.
// `Mina 1` has to stay undelegated for this spec: on an already-delegating account the continue
// button stays disabled on the current delegate, and the operation is typed REDELEGATE. `Mina 2`
// is the account kept delegated, for the undelegate spec.
const delegation = new Delegate(Account.MINA_1, "N/A", "Kraken");
runMinaDelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@mina`, `@family-mina`],
);
