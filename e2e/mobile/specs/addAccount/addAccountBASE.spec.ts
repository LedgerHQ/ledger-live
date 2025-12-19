import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.BASE, ["B2CQA-4226", "B2CQA-4227", "B2CQA-4228"]);
