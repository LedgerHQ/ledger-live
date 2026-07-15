import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.XRP_1,
  ["B2CQA-2557"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ripple`, `@family-xrp`],
);
