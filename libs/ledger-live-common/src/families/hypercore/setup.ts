// Goal of this file is to inject live-config into the coin-hypercore module.
// HyperCore is read-only here: no bridge/signer/resolver/cliTools are exported.

import coinConfig, { type HyperCoreCoinConfig } from "@ledgerhq/coin-hypercore/config";
import { getCurrencyConfiguration } from "../../config";

coinConfig.setCoinConfig(() => getCurrencyConfiguration<HyperCoreCoinConfig>("hypercore"));
