import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.XTZ, ["B2CQA-2507", "B2CQA-2655", "B2CQA-2683"]);
