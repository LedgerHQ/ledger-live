import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runNavigateToBuyFromMarketPageTest, runNavigateToBuyFromAssetPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

const usdtBuySell = {
  crypto: TokenAccount.ETH_USDT_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "900",
  operation: OperationType.Buy,
};

const ethBuySell = {
  crypto: Account.ETH_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "230",
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
  "@ethereum",
  "@family-evm",
];

runNavigateToBuyFromMarketPageTest(usdtBuySell, paymentMethod, ["B2CQA-3414"], tags);

runNavigateToBuyFromAssetPageTest(ethBuySell, paymentMethod, ["B2CQA-3392"], [...tags, "@smoke"]);
