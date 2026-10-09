/**
 * JS thread lag sampled during e2e tests and attached to Allure on failure.
 *
 * App-side request durations are measured in JS, so they include the time a response waits for
 * the JS thread. This tells a slow backend apart from a saturated JS thread, e.g. during the Buy
 * screen's `currency.list` fan-out of several hundred CAL lookups.
 *
 * Uses `setInterval` on purpose: Detox ignores repeating timers when deciding whether the app is
 * idle, whereas a `setTimeout` chain this short would keep it busy forever.
 */

const SAMPLE_INTERVAL_MS = 100;
// One bucket per second: 10 minutes covers a full spec with retries' worth of slack.
const MAX_BUCKETS = 600;

export interface JsThreadLagBucket {
  /** Start of the second, ISO 8601, to line up with the network log timestamps. */
  timestamp: string;
  samples: number;
  meanLagMs: number;
  maxLagMs: number;
}

export interface JsThreadLagSummary {
  sampleIntervalMs: number;
  samples: number;
  maxLagMs: number;
  samplesOver100Ms: number;
  samplesOver500Ms: number;
  samplesOver1000Ms: number;
}

type OpenBucket = { second: number; samples: number; lagSum: number; maxLag: number };

const buckets: JsThreadLagBucket[] = [];
let open: OpenBucket | undefined;
const summary: JsThreadLagSummary = {
  sampleIntervalMs: SAMPLE_INTERVAL_MS,
  samples: 0,
  maxLagMs: 0,
  samplesOver100Ms: 0,
  samplesOver500Ms: 0,
  samplesOver1000Ms: 0,
};

function toBucket(bucket: OpenBucket): JsThreadLagBucket {
  return {
    timestamp: new Date(bucket.second * 1000).toISOString(),
    samples: bucket.samples,
    meanLagMs: Math.round(bucket.lagSum / bucket.samples),
    maxLagMs: bucket.maxLag,
  };
}

function closeBucket(bucket: OpenBucket): void {
  buckets.push(toBucket(bucket));
  if (buckets.length > MAX_BUCKETS) buckets.shift();
}

function record(now: number, lag: number): void {
  summary.samples += 1;
  summary.maxLagMs = Math.max(summary.maxLagMs, lag);
  if (lag > 100) summary.samplesOver100Ms += 1;
  if (lag > 500) summary.samplesOver500Ms += 1;
  if (lag > 1000) summary.samplesOver1000Ms += 1;

  const second = Math.floor(now / 1000);
  if (open && open.second !== second) {
    closeBucket(open);
    open = undefined;
  }
  open ??= { second, samples: 0, lagSum: 0, maxLag: 0 };
  open.samples += 1;
  open.lagSum += lag;
  open.maxLag = Math.max(open.maxLag, lag);
}

export const jsThreadLagStore = {
  getBuckets(): JsThreadLagBucket[] {
    return open ? [...buckets, toBucket(open)] : [...buckets];
  },

  getSummary(): JsThreadLagSummary {
    return { ...summary };
  },
};

let started = false;

/** Start sampling JS thread lag. Only installed under Config.DETOX, via the e2e bridge client. */
export function initJsThreadLagMonitor(): void {
  if (started) return;
  started = true;

  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    record(now, Math.max(0, now - last - SAMPLE_INTERVAL_MS));
    last = now;
  }, SAMPLE_INTERVAL_MS);
}
