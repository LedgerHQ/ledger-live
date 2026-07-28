import { setEnv } from "@ledgerhq/live-env";
import { TEST_KASPA_ENDPOINT } from "./msw.mock";

// Runs as a jest `setupFiles` entry (before the test modules load), so `network/config.ts` — which
// reads `API_KASPA_ENDPOINT` into a module-level const at import time — resolves to the test host
// that the MSW handlers intercept.
setEnv("API_KASPA_ENDPOINT", TEST_KASPA_ENDPOINT);
