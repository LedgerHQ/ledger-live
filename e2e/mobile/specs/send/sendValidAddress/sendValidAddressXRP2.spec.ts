import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "2", undefined, "noTag");
runSendValidAddressTest(transaction, ["B2CQA-2719"], "without tag", [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ripple",
  "@family-xrp",
]);
