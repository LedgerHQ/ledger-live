import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW);
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2573"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@dogecoin",
    "@family-bitcoin",
  ],
});
