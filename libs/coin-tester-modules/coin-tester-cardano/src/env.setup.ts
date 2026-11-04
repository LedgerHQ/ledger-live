// Wire the framework currencies resolver before `./fixtures` is imported below: this file runs in
// `setupFiles` (before `setupFilesAfterEnv`), and fixtures.ts resolves currencies at module-eval.
import "@ledgerhq/wallet-framework-test-setup";
import { setEnv } from "@shared/env";
import { MOCK_API } from "./fixtures";

global.console = require("console");

// Only the epoch-params endpoint remains environment-backed. API endpoints come from each
// scenario's Cardano coin config, so they are not captured at module evaluation time.
// getValidators' epoch-params endpoint is a separate Ledger host; point its testnet endpoint at
// the adapter so the suite stays hermetic (served from a captured fixture).
setEnv("CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT", `${MOCK_API}/epoch-params`);
