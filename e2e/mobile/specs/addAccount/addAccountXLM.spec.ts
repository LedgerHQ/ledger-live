import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(
  Currency.XLM,
  ["B2CQA-2506", "B2CQA-2651", "B2CQA-2679"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
);
