import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runMinaDelegateTest } from "@e2e/specs/delegate/delegate";

// Mina delegates the whole balance, so the flow carries no amount. `Mina 1` stays undelegated for
// this spec, `Mina 2` delegated for the redelegate and undelegate ones.
const delegation = new Delegate(Account.MINA_1, "N/A", "Kraken", Addresses.MINA_KRAKEN_VALIDATOR);
runMinaDelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
