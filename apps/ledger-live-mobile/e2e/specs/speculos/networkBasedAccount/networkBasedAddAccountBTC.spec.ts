import { runNetworkBasedAddAccountTest } from "./networkBasedAddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runNetworkBasedAddAccountTest(Currency.BTC, "B2CQA-2499, B2CQA-2644, B2CQA-2672, B2CQA-786");
