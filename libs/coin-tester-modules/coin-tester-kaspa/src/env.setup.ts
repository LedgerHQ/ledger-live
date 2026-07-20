// Runs in `setupFiles` before any test file is evaluated.
// coin-kaspa's config.ts captures API_KASPA_ENDPOINT at module-eval time, so the env var
// must be set here — setting it inside a test/beforeAll is too late.
import { setEnv } from "@ledgerhq/live-env";

setEnv("API_KASPA_ENDPOINT", "http://localhost:8080");
