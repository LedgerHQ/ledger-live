import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runLockCelo } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate(Account.CELO_1, "0.001", "N/A");
runLockCelo({
  delegation,
  tmsLinks: ["B2CQA-3042"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@celo`, `@family-celo`],
});
