import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.MINA_1, "1", "Minascan Pool | Staketab");
runDelegateTest(
  delegation,
  ["B2CQA-MINA-001"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@mina`, `@family-mina`],
);
