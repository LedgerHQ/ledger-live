import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "@e2e/specs/deleteAccount/deleteAccount";

runDeleteAccountTest(
  Account.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-2548"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@bitcoin`, `@family-bitcoin`],
);
