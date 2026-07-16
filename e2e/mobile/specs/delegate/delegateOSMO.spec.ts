import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment");
runDelegateTest(
  delegation,
  ["B2CQA-3022"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@osmo`, `@family-cosmos`],
);
