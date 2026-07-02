import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(
  Account.ATOM_1,
  ["B2CQA-2560", "B2CQA-2694"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
);
