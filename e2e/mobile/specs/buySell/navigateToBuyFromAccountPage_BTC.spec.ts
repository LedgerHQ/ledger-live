import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runNavigateToBuyFromAccountPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

const btcBuySell = {
  crypto: Account.BTC_NATIVE_SEGWIT_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "900",
  operation: OperationType.Buy,
};

const paymentMethod = "card";

const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@bitcoin",
  "@family-bitcoin",
];

runNavigateToBuyFromAccountPageTest(btcBuySell, paymentMethod, ["B2CQA-3467"], tags);
