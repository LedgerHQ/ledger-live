import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSellFlowTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-e2e-shared/enum/OperationType";
import { BuySellProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";

const testConfig = {
  buySell: {
    crypto: Account.BTC_NATIVE_SEGWIT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    operation: OperationType.Sell,
  },
  tmsLinks: ["B2CQA-6131"],
  provider: BuySellProvider.MOONPAY,
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin", "@family-bitcoin"],
};

runSellFlowTest(
  testConfig.buySell,
  testConfig.provider,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
