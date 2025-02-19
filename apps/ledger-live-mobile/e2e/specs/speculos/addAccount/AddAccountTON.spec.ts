import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.TON, ["B2CQA-2643", "B2CQA-2657", "B2CQA-2685"]);
