import coinConfig from "../config";
import { infraByCurrency } from "./coinConfig";

// The module resolves its endpoints through the coin config the app seeds, one entry per currency.
coinConfig.setCoinConfig(currencyId => ({
  status: { type: "active" },
  maxFeesWarning: 5e6,
  maxFeesError: 10e6,
  infra: infraByCurrency[currencyId ?? "cardano"],
}));
