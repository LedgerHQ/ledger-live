import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.ALGO, ["B2CQA-2497", "B2CQA-2653", "B2CQA-2681"]);
