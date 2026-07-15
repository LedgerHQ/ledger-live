import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";

// on-chain validator moniker still reads "Ledger by Chorus One"; flip back to "Ledger by Bitwise" once renamed on-chain
const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger by Chorus One");
runDelegateTest(
  delegation,
  ["B2CQA-2740", "B2CQA-2770"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
);
