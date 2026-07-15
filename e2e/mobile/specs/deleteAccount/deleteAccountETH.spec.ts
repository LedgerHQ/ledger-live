import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(
  Account.ETH_1,
  ["B2CQA-2551"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@ethereum",
    "@family-evm",
  ],
);
