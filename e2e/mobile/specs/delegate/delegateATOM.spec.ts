import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger by Chorus One");
runDelegateTest(
  delegation,
  ["B2CQA-2740", "B2CQA-2770"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
);
