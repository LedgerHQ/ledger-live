import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.DOGE_1,
  accountToCredit: Account.DOGE_2,
  amount: "0.01",
  speed: Fee.SLOW,
});
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
