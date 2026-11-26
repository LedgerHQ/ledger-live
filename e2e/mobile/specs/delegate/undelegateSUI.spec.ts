import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSuiUndelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG");
runSuiUndelegateTest({
  delegation,
  tmsLinks: ["B2CQA-387"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@sui`, `@family-sui`],
});
