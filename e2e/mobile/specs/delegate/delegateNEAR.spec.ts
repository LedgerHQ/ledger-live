import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDelegateTest } from "./delegate";

const delegation = new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near");
runDelegateTest(
  delegation,
  ["B2CQA-2741"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@near", "@family-near"],
);
