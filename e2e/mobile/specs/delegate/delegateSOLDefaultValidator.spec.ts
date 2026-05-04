import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateDefaultValidatorTest } from "./delegate";

const delegation = new Delegate(Account.SOL_2, "0.001", "Ledger by Figment");
runDelegateDefaultValidatorTest(
  delegation,
  ["B2CQA-2730"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
);
