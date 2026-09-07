import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "@e2e/specs/deleteAccount/deleteAccount";

runDeleteAccountTest(
  Account.XLM_1,
  ["B2CQA-2554"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@stellar`, `@family-stellar`],
);
