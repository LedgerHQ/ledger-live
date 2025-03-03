import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.SOL, ["B2CQA-2642", "B2CQA-2656", "B2CQA-2684"]);
