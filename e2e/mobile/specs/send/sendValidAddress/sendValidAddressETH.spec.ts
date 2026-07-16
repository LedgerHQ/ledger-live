import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.MEDIUM);
runSendValidAddressTest(transaction, ["B2CQA-2714"], "new account", [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
]);
