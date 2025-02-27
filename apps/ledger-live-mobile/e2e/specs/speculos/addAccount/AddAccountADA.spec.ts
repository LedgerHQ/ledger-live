import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.ADA, ["B2CQA-2500", "B2CQA-2650", "B2CQA-2678"]);
