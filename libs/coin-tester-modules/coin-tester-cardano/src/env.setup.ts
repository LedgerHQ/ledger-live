// Wire the framework currencies resolver before `./fixtures` is imported below: this file runs in
// `setupFiles` (before `setupFilesAfterEnv`), and fixtures.ts resolves currencies at module-eval.
import "@ledgerhq/wallet-framework-test-setup";
import { setEnv } from "@ledgerhq/live-env";
import { MOCK_API } from "./fixtures";

global.console = require("console");

// Must run before coin-cardano's constants.ts loads — it captures CARDANO_API_ENDPOINT /
// CARDANO_TESTNET_API_ENDPOINT at module-eval time, so setting them inside setup() is too late.
// Both point at MOCK_API: the mainnet (mock) scenarios hit CARDANO_API_ENDPOINT, the testnet (Yaci)
// scenario hits CARDANO_TESTNET_API_ENDPOINT; each scenario starts only its own MSW handler set.
setEnv("CARDANO_API_ENDPOINT", MOCK_API);
setEnv("CARDANO_TESTNET_API_ENDPOINT", MOCK_API);
// getValidators' epoch-params endpoint is a separate Ledger host; point it at the adapter too so the
// suite stays hermetic (served from a captured fixture).
setEnv("CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT", `${MOCK_API}/epoch-params`);
