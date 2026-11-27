import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVoteCelo } from "@e2e/specs/delegate/delegate";

const delegation = new Delegate({
  account: Account.CELO_1,
  amount: "0.001",
  provider: "first-available",
});
runVoteCelo({
  delegation,
  tmsLinks: ["B2CQA-201"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@celo`, `@family-celo`],
});
