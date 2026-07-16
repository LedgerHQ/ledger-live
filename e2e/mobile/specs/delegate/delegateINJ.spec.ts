import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";

// on-chain validator moniker still reads "Ledger by Chorus One"; flip back to "Ledger by Bitwise" once renamed on-chain
const delegation = new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One");
runDelegateTest(
  delegation,
  ["B2CQA-3021"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@injective`, `@family-cosmos`],
);
