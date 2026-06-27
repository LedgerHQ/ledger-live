import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(
  Account.ETH_1,
  Account.BTC_NATIVE_SEGWIT_1,
  "0.00001",
  Fee.MEDIUM,
);
runSendInvalidAddressTest(
  transaction,
  "This is not a valid Ethereum address",
  Addresses.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-2709"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
