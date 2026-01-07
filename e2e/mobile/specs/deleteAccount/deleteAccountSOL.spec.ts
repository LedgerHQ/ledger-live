import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.SOL_1,
  ["B2CQA-2553"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@solana`, `@family-solana`],
);
