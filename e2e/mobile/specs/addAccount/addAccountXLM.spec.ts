import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.XLM, ["B2CQA-2506", "B2CQA-2651", "B2CQA-2679"]);
