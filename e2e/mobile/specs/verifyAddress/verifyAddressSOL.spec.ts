import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runVerifyAddressTest } from "@e2e/specs/verifyAddress/verifyAddress";

runVerifyAddressTest(
  Account.SOL_1,
  ["B2CQA-2563"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
);
