import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.TRX, ["B2CQA-2508", "B2CQA-2649", "B2CQA-2677"]);
