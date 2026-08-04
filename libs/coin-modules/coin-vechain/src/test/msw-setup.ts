import { setEnv } from "@ledgerhq/live-env";
import { TEST_VECHAIN_ENDPOINT } from "./msw.mock";

// Runs as a jest `setupFiles` entry (before the test modules load), so `constants/env.ts` — which
// reads `API_VECHAIN_THOREST` into a module-level const at import time — resolves to the test host
// that the MSW handlers intercept.
setEnv("API_VECHAIN_THOREST", TEST_VECHAIN_ENDPOINT);
