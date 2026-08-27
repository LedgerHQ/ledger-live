import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "specs/send/send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_2, "0.0001");
runSendTest(
  transaction,
  ["B2CQA-2809"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polkadot", "@family-polkadot"],
);
