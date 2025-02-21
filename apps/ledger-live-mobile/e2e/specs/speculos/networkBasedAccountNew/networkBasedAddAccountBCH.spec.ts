import { runNetworkBasedAddAccountTest } from "./networkBasedAddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runNetworkBasedAddAccountTest(Currency.BCH, "B2CQA-2498, B2CQA-2652, B2CQA-2680");
