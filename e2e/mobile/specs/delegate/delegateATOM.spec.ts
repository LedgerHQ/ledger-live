import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate({
  account: Account.ATOM_1,
  amount: "0.001",
  provider: "Ledger by Bitwise",
});
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-2740"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
});
