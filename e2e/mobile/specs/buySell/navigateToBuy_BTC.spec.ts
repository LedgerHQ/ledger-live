import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import {
  runNavigateToBuyFromPortfolioPageTest,
  runNavigateToBuyFromAccountPageTest,
} from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";

const btcBuySell = {
  crypto: Account.BTC_NATIVE_SEGWIT_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "900",
  operation: OperationType.Buy,
};

const provider = Provider.MOONPAY;
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

runNavigateToBuyFromPortfolioPageTest(btcBuySell, provider, paymentMethod, ["B2CQA-3520"], tags);

runNavigateToBuyFromAccountPageTest(btcBuySell, provider, paymentMethod, ["B2CQA-3467"], tags);
