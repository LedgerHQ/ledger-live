import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.MEDIUM);
runSendValidAddressTest(transaction, ["B2CQA-2726"], "cash address", [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@bitcoin_cash",
  "@family-bitcoin",
]);
