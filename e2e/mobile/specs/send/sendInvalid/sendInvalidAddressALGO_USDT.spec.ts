import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(
  TokenAccount.ALGO_USDT_1,
  Account.ALGO_3,
  "0.1",
  undefined,
  "noTag",
);
runSendInvalidAddressTest(
  transaction,
  "Recipient account has not opted in the selected ASA.",
  undefined,
  ["B2CQA-2702"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@algorand", "@family-algorand"],
  transaction.accountToDebit.currency.name,
);
