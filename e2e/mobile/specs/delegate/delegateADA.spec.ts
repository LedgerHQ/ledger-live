import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";
import { setEnv } from "@shared/env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate({
  account: Account.ADA_1,
  amount: "0.01",
  provider: "LBF3 - Ledger by Figment 3",
});
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-3023"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cardano`, `@family-cardano`],
});
