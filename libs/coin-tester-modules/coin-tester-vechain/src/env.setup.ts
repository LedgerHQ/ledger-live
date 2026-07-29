// Wire the framework currencies resolver before `./fixtures` is imported below: this file runs in
// `setupFiles` (before `setupFilesAfterEnv`), and fixtures.ts resolves currencies at module-eval time.
import "@ledgerhq/wallet-framework-test-setup";
import { setEnv } from "@shared/env";
import { THOR_SOLO_RPC } from "./thorNode";

global.console = require("console");

// Must run before coin-vechain's constants/env.ts loads — it captures API_VECHAIN_THOREST at
// module-eval time (`VECHAIN_NODE_URL = getEnv("API_VECHAIN_THOREST")`), so setting it inside
// setup() would be too late.
setEnv("API_VECHAIN_THOREST", THOR_SOLO_RPC);
