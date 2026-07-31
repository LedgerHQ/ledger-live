/* eslint-disable no-console */
// Backward-compat shim. The implementation moved to `e2e/mobile/scripts/shard-tests.mjs`.
// Kept temporarily so release/hotfix branches — whose CI checks out this path via the
// @develop-pinned mobile workflows/actions — keep working during the transition window.
// TODO(remove ~2026-08-15): delete this file once release/hotfix no longer reference this path.
import { fileURLToPath } from "url";

import { main } from "../../../e2e/mobile/scripts/shard-tests.mjs";

export * from "../../../e2e/mobile/scripts/shard-tests.mjs";

// Mirror the target module's guard so CLI invocation of THIS path still runs main().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
