import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.BCH_1,
  accountToCredit: Account.BCH_2,
  amount: "0.0001",
  speed: Fee.SLOW,
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2808"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin_cash",
    "@family-bitcoin",
  ],
});
