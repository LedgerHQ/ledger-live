import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.XTZ, ["B2CQA-2507", "B2CQA-2655", "B2CQA-2683"]);
