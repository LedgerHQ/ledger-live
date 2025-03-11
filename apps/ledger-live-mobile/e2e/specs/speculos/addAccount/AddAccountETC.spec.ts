import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.ETC, ["B2CQA-2502", "B2CQA-2646", "B2CQA-2674"]);
