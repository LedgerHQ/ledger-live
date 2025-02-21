import { runNetworkBasedAddAccountTest } from "./networkBasedAddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runNetworkBasedAddAccountTest(Currency.SOL, "B2CQA-2642, B2CQA-2656, B2CQA-2684");
