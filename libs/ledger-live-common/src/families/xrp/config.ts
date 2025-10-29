import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const xrpConfig: CurrencyLiveConfigDefinition = {
  config_currency_ripple: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: "https://xrp.coin.ledger-test.com",
    } as XrpCoinConfig,
  },
};
