import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW);
runSendTest(
  transaction,
  ["B2CQA-2807"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polygon", "@family-evm"],
);
