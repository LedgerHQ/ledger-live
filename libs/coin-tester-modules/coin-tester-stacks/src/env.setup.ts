// Runs in Jest's `setupFiles` (before `setupFilesAfterEnv` and before any test file is required):
// `coin-stacks`'s `network/api.ts` builds its `StacksNetwork` map (including the `devnet` entry
// added for this package) at module-evaluation time by reading `API_STACKS_ENDPOINT` through
// `@ledgerhq/live-env`'s `getEnv`. Setting it here guarantees the env var is in place before
// `helpers.ts` (or anything else) performs its first `import "@ledgerhq/coin-stacks"`; setting it
// inside the scenario's `setup()` would run after that import has already resolved.
import "@ledgerhq/wallet-framework-test-setup";
import { setEnv } from "@ledgerhq/live-env";
import { STACKS_DEVNET_URL } from "./devnet";

setEnv("API_STACKS_ENDPOINT", STACKS_DEVNET_URL);

global.console = require("console");
