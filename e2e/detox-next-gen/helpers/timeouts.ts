/**
 * Standard wait durations (ms) as abstract **speed tiers** — `XS` (snappiest)
 * to `XL` (slowest). Tiers are bound to *how long* an operation may take, not
 * to which feature needs it, so the same tier is reused anywhere an operation
 * shares that speed profile.
 *
 * Picking a tier: choose the smallest that comfortably covers the operation's
 * worst case. The parenthetical examples are hints, not bindings.
 *
 * Current convention: call sites default to `XS`; bump an individual call site
 * up a tier only once a flow proves it needs longer. `S`–`XL` stay defined as
 * those on-demand escape hatches.
 */
export const TIMEOUTS = {
  /** 1s — snappy, already-rendered native UI. */
  XS: 1_000,
  /** 5s — content that settles asynchronously (e.g. a webview). */
  S: 5_000,
  /** 60s — gated on a single network round-trip. */
  M: 60_000,
  /** 120s — gated on a signed transaction processing / on-chain settlement. */
  L: 120_000,
  /** 180s — a multi-minute on-device stream (e.g. account discovery). */
  XL: 180_000,
} as const;

/** A speed-tier key (`"XS" | "S" | "M" | "L" | "XL"`). */
export type TimeoutCategory = keyof typeof TIMEOUTS;

/** Gap between polls when waiting on a webview element (Detox has no web `waitFor`). */
export const POLL_INTERVAL = 500;
