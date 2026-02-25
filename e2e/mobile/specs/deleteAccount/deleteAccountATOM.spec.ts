import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.ATOM_1,
  ["B2CQA-2550"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@cosmos`, `@family-cosmos`],
);
