import { setRateLookup } from "@ledgerhq/asset-aggregation/rateLookup";
import { calculate } from "@ledgerhq/live-countervalues/logic";

// Import for its side effect from any suite that renders a balance through
// asset-aggregation. Deliberately not in the global setup: `logic` reaches
// `@ledgerhq/live-network`, and loading that before a suite's `jest.mock` of it
// applies breaks the swap api suites.
setRateLookup({ calculate });
