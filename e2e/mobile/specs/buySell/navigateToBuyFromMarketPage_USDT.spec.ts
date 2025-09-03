import { runNavigateToBuyFromMarketPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";

const testConfig = {
  buySell: {
    crypto: TokenAccount.ETH_USDT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "900",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3414"],
  provider: Provider.COINBASE,
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
