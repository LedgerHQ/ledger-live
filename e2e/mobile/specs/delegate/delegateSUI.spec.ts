import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSuiDelegateTest } from "./delegate";

const delegation = new Delegate(Account.SUI_1, "1", "Ledger by Figment");
runSuiDelegateTest(
  delegation,
  ["B2CQA-387-1"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@sui`, `@family-sui`],
);
