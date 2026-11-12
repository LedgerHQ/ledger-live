// A nearblocks 429 means the shared daily quota is spent: a retry cannot succeed before it resets
// and only multiplies the load. Other transient failures keep live-network's default retries.
export const NEARBLOCKS_RETRY = {
  statuses: [408, 413, 500, 502, 503, 504, 521, 522, 524],
} as const;
