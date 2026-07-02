import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runQueryParametersTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-e2e-shared/enum/OperationType";

const testConfig = {
  buySell: {
    crypto: Account.BTC_NATIVE_SEGWIT_1,
    fiat: { locale: "en-US", currencyTicker: "USD" },
    amount: "900",
    operation: OperationType.Buy,
  },
  tmsLinks: ["B2CQA-3521"],
  paymentMethod: "card",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@bitcoin`, `@family-bitcoin`],
};

runQueryParametersTest(
  testConfig.buySell,
  testConfig.paymentMethod,
  testConfig.tmsLinks,
  testConfig.tags,
);
