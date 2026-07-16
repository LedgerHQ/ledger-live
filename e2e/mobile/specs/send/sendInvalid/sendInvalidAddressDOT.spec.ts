import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_1, "0.5");
runSendInvalidAddressTest(
  transaction,
  "Destination and source accounts must not be the same.",
  undefined,
  ["B2CQA-2711"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polkadot", "@family-polkadot"],
);
