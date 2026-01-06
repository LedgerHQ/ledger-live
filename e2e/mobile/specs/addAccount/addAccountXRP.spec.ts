import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.XRP, ["B2CQA-2505", "B2CQA-2647", "B2CQA-2675"]);
