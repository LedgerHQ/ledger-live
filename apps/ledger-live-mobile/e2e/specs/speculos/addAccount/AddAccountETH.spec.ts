import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.ETH, ["B2CQA-2503", "B2CQA-2645", "B2CQA-2673"]);
