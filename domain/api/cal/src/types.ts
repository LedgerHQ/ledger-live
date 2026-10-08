/**
 * Outcome of a CAL probe.
 * - `ok`: CAL answered with a 2xx in time.
 * - `failed`: CAL is reachable but unhealthy (non-2xx, timeout). Fail-closed.
 * - `offline`: no connectivity (OS reports offline, or the request never got an HTTP answer). Fail-open.
 */
export type CalProbeResult = "ok" | "failed" | "offline";
