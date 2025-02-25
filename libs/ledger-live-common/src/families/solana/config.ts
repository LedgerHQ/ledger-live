import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const solanaConfig: CurrencyLiveConfigDefinition = {
  config_currency_solana: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      token2022Enabled: false,
    } as SolanaCoinConfig,
  },
};
