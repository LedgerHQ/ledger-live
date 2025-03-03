import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.DOT, ["B2CQA-2504", "B2CQA-2648", "B2CQA-2676"]);
