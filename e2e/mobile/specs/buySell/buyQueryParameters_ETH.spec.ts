import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runQueryParametersTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

const testConfig = {
  buySell: {
    crypto: Account.ETH_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "230",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3522"],
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runQueryParametersTest(
  testConfig.buySell,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
