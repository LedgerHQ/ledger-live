import { runQueryParametersTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

const testConfig = {
  buySell: {
    crypto: TokenAccount.ETH_USDT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "900",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3523"],
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
};

runQueryParametersTest(
  testConfig.buySell,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
