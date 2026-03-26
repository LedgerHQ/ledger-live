import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runNavigateToBuyFromAssetPageTest } from "./buySell";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

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

runNavigateToBuyFromAssetPageTest(ethBuySell, paymentMethod, ["B2CQA-3392"], [...tags, "@smoke"]);
