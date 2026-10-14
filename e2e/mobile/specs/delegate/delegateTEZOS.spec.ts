import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTezos } from "@e2e/specs/delegate/delegate";

// XTZ_1 (index 0) must be funded + UNDELEGATED: with the staking flag on, Earn opens the earning-choice chooser.
const delegation = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
runDelegateTezos(
  delegation,
  ["B2CQA-3041"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@tezos`, `@family-tezos`],
);
