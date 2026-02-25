import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.TRX_1,
  ["B2CQA-2556"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@tron`, `@family-tron`],
);
