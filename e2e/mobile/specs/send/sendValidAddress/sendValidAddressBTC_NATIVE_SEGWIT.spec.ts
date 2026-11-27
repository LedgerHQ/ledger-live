import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.BTC_NATIVE_SEGWIT_1,
  accountToCredit: Account.BTC_NATIVE_SEGWIT_2,
  amount: "0.00001",
  speed: Fee.MEDIUM,
});
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2724"],
  scenario: "native segwit",
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@bitcoin",
    "@family-bitcoin",
  ],
});
