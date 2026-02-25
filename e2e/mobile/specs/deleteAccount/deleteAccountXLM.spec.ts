import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.XLM_1,
  ["B2CQA-2554"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@stellar`, `@family-stellar`],
);
