import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate({
  account: Account.INJ_1,
  amount: "0.0000001",
  provider: "Ledger by Bitwise",
});
runDelegateTest({
  delegation,
  tmsLinks: ["B2CQA-3021"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    `@injective`,
    `@family-cosmos`,
  ],
});
