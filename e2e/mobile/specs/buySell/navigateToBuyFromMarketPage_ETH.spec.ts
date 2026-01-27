import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runNavigateToBuyFromMarketPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";

const testConfig = {
  buySell: {
    crypto: Account.ETH_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "230",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3413"],
  provider: Provider.MOONPAY,
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
};

runNavigateToBuyFromMarketPageTest(
  testConfig.buySell,
  testConfig.provider,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
