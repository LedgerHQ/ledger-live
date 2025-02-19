import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.BCH, ["B2CQA-2498", "B2CQA-2652", "B2CQA-2680"]);
