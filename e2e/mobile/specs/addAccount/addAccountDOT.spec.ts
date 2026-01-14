import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.DOT, ["B2CQA-2504", "B2CQA-2648", "B2CQA-2676"]);
