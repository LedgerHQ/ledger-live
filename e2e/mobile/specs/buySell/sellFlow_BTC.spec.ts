import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSellFlowTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { BuySellProvider } from "@ledgerhq/live-common/e2e/enum/Provider";

const testConfig = {
  buySell: {
    crypto: Account.BTC_NATIVE_SEGWIT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "0",
    operation: OperationType.Sell,
  },
  tmsLinks: ["B2CQA-3524"],
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
