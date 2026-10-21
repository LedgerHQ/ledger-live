import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment");
runDelegateTest(
  delegation,
  ["B2CQA-3020"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@elrond`, `@family-multiversx`],
  // Speculos cannot parse the Nano S MultiversX app binary.
  { skipLNS: true, disableBroadcast: true },
);
