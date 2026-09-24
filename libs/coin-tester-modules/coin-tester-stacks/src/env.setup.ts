// Runs in Jest's `setupFiles`, before `setupFilesAfterEnv` and before any test file is required, so
// every bridge strategy reads the devnet endpoint from the live config and the env flags below are
// in place before `helpers.ts` performs its first `import "@ledgerhq/coin-stacks"`.
import "@ledgerhq/wallet-framework-test-setup";
import { setEnv } from "@ledgerhq/live-env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { STACKS_DEVNET_URL } from "./devnet";

LiveConfig.setConfig({
  config_currency_stacks: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: { API_STACKS_ENDPOINT: STACKS_DEVNET_URL },
    },
  },
});
// The devnet's genesis accounts (`settings/Devnet.toml`) are funded on testnet-versioned (`ST...`)
// addresses, not mainnet (`SP...`) ones — see `bridge/synchronization.ts`'s `API_STACKS_NETWORK`
// read, added specifically so a devnet/testnet consumer can get the correctly-versioned address.
setEnv("API_STACKS_NETWORK", "testnet");
// This devnet's fee estimator has no historical data for a fresh chain, so `prepareTransaction`'s
// network estimate is unusable here — the "legacy" strategy's scenarios pre-set their own fixed
// `customFees` instead (`scenarii/stacks.ts`) and rely on this flag to have them honored verbatim.
setEnv("API_STACKS_SKIP_FEE_ESTIMATE", true);

global.console = require("console");
