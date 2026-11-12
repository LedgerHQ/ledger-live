import "@shared/env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { registerAllCoins } from "../../coin-modules/load-all-coins";

registerAllCoins();

// Stellar: use static fees in tests so fee and spendable balance are deterministic and need no
// network call to Horizon. Object overrides are deep-merged with the config defaults.
LiveConfig.setOverride("config_currency_stellar", { useStaticFees: true });
