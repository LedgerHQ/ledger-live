import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.BCH_1,
  ["B2CQA-2558"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin_cash", "@family-bitcoin"],
);
