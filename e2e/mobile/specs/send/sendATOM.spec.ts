import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001", undefined, "noTag");
runSendTest(
  transaction,
  ["B2CQA-2814"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
);
