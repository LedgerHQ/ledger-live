import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDeleteAccountTest } from "./deleteAccount";

runDeleteAccountTest(Account.BTC_NATIVE_SEGWIT_1, ["B2CQA-2548"]);
