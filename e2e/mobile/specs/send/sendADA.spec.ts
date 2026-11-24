import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ADA_1, Account.ADA_2, "1", undefined, "noTag");
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2815"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cardano", "@family-cardano"],
});
