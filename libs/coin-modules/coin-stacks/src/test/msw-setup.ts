import { setEnv } from "@ledgerhq/live-env";
import { TEST_STACKS_ENDPOINT } from "./msw.mock";

// Runs as a jest `setupFiles` entry (before the test modules load), so `network/api.ts` -- which
// reads `API_STACKS_ENDPOINT` per call via `getEnv` -- resolves to the test host the MSW handlers
// intercept.
setEnv("API_STACKS_ENDPOINT", TEST_STACKS_ENDPOINT);
