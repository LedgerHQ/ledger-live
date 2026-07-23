import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";
import { setEnv } from "@shared/live-env";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const delegation = new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment");
runDelegateTest(
  delegation,
  ["B2CQA-3020"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@elrond`, `@family-multiversx`],
);
