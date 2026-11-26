import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";
import { setEnv } from "@shared/env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate({
  account: Account.SOL_2,
  amount: "1",
  provider: "Ledger by Figment",
});
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-2742"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@solana`, `@family-solana`],
});
