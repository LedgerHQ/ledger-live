import { runNavigateToBuyFromMarketPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";

const testConfig = {
  buySell: {
    crypto: Account.BTC_NATIVE_SEGWIT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "900",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3412"],
  provider: Provider.MOONPAY,
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runNavigateToBuyFromMarketPageTest(
  testConfig.buySell,
  testConfig.provider,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
