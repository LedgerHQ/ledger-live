import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.ETH_1,
  ["B2CQA-2561"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@ethereum",
    "@family-evm",
  ],
);
