import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2_LOWER_CASE, "0.0001");
runSendValidAddressTest(
  transaction,
  ["B2CQA-2717"],
  "lower case address",
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  undefined,
  "Auto-verification not available: carefully verify the address.",
);
