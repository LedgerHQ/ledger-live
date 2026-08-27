import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger by Bitwise");
runDelegateTest(
  delegation,
  ["B2CQA-2740"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
);
