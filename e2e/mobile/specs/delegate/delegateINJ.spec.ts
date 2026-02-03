import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One");
runDelegateTest(
  delegation,
  ["B2CQA-3021"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@injective`, `@family-cosmos`],
);
