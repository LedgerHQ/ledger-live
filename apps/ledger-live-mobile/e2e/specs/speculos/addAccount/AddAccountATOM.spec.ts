import { runAddAccountTest } from "./AddAccount";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

runAddAccountTest(Currency.ATOM, ["B2CQA-2501", "B2CQA-2654", "B2CQA-2682"]);
