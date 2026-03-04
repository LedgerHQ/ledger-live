import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVerifyAddressTest } from "./verifyAddress";

runVerifyAddressTest(
  Account.DOT_1,
  ["B2CQA-2562", "B2CQA-2691"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polkadot", "@family-polkadot"],
);
