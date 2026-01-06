import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { runAddAccountTest } from "./addAccount";

runAddAccountTest(Currency.APT, ["B2CQA-3644", "B2CQA-3645", "B2CQA-3646"]);
