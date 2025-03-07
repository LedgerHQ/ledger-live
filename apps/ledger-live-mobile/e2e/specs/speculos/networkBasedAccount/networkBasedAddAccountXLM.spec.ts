import { runNetworkBasedAddAccountTest } from "./networkBasedAddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runNetworkBasedAddAccountTest(Currency.XLM, "B2CQA-2506, B2CQA-2651, B2CQA-2679");
