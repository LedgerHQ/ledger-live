import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "@e2e/specs/deleteAccount/deleteAccount";

runDeleteAccountTest(
  Account.ALGO_1,
  ["B2CQA-2546"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@algorand`, `@family-algorand`],
);
