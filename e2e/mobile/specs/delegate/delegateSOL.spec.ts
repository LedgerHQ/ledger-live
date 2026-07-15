import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";
import { setEnv } from "@ledgerhq/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate(Account.SOL_2, "1", "Ledger by Figment");
runDelegateTest(
  delegation,
  ["B2CQA-2742"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@solana`, `@family-solana`],
);
