import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "@e2e/specs/addAccount/addAccount";

runAddAccountTest(
  Currency.SUI,
  // TODO: add the Xray B2CQA id of the Sui add-account test case once it exists
  [],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
);
