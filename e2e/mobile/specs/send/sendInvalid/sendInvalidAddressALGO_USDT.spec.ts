import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(
  TokenAccount.ALGO_USDT_1,
  TokenAccount.ALGO_USDT_2,
  "0.1",
  undefined,
  "noTag",
);
runSendInvalidAddressTest(
  transaction,
  "Recipient account has not opted in the selected ASA.",
  undefined,
  ["B2CQA-2702"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  transaction.accountToDebit.currency.name,
);
