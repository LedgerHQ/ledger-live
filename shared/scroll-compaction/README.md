# @shared/scroll-compaction

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Compacts a bar while the user scrolls down and expands it when they scroll back up, like a bottom tab bar that shrinks out of the way. Ledger Wallet Mobile uses it for its main tab bar.

## Exports

- `getNextScrollCompaction`: the pure rule, safe to run as a Reanimated worklet. The bar compacts after `SCROLL_COMPACTION_DIRECTION_THRESHOLD` px scrolled in one direction and expands after the same distance up or within `SCROLL_COMPACTION_TOP_OFFSET` px of the top. It ignores the bounce past the content end.
- `createScrollCompactionStore`: a small external store for the compact state. `reset()` expands the bar and moves to a new reset generation: scroll tracking restarts from the current offset, and updates computed before the reset are dropped. The `onApply` and `onReset` options let the caller mirror the state, for example into Reanimated shared values.
- `createScrollCompactionHandler`: a JS-thread `onScroll` listener for scrollables without a UI-thread scroll handler, such as webviews.

The package has no runtime dependency. Callers bind the store to React with `useSyncExternalStore`.
