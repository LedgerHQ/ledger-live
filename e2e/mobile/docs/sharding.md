# How mobile E2E sharding works

The mobile E2E suite is split across parallel CI jobs ("shards"). This explains how the split is
calculated, what limits it, and how to check any of it yourself with
`e2e/mobile/scripts/shard-balance.mjs`.

## The only number that matters is the slowest shard

All shards start at the same time and the phase ends when the **last** one finishes. If eleven
shards finish in 15 minutes and one takes 35, the phase costs 35 minutes. The average is
irrelevant.

That means a sharded run can be slow for two different reasons, with different fixes:

| | Cause | Fix |
|---|---|---|
| **(a)** | Not enough shards — the split is fair, there is just too much work per shard | More runners (capacity, cost) |
| **(b)** | Badly balanced shards — enough shards, but one got all the slow tests | Better packing (free, code-only) |

Ruling out (b) is what makes a capacity request defensible, so check it before asking for one.

## Where the split is calculated

`e2e/mobile/scripts/shard-tests.mjs` is called twice per run, in two different modes.

**Selection** — `node shard-tests.mjs [testFilter] [testRootDir]` scans for spec files and applies
the filter via `e2e/tooling/filter/selectSpecs.mjs`, printing the matching list. The workflow does
this once, in `determine-builds`.

**Sharding** — `node shard-tests.mjs [fileList] [platform] [testRootDir] [shardIndex] [shardTotal]`
takes that precomputed list (no re-scan, no re-filter) and returns the files for one shard. Each
shard job calls this separately with its own `shardIndex`.

## The algorithm: LPT-greedy

`distributeFilesByTiming` does two passes.

Files **with** a recorded duration are sorted longest-first, then each is handed to whichever shard
currently has the least accumulated time:

```js
for (const { file, duration } of testsWithTiming) {
  // find the shard with the minimum total time, ties going to the lower index
  shards[minShardIndex].files.push(file);
  shards[minShardIndex].totalDuration += duration;
}
```

Files **without** a duration go round-robin by index afterwards, since there is nothing to balance
them on.

This is textbook LPT (Longest Processing Time first) scheduling. Ties break on the lower shard
index and, for equal durations, on file path, so the partition is deterministic — every shard job
independently computes the same split without coordinating.

Note the granularity: distribution is **per spec file**, never per test. A single file is always
entirely within one shard.

## Where the durations come from

Timing is a feedback loop through S3. After a run, `merge-ios-timings` / `merge-android-timings`
write `e2e/mobile/artifacts/e2e-test-results-<platform>.json`, and the next run restores it in
`determine-builds` before sharding. `loadTimingData` converts the Jest results into
`{ [specBasename]: { duration } }`, where duration is `endTime - startTime` per file.

**The cache key is exact-match only.** From `test-mobile-e2e-reusable.yml`:

```
android_timing_cache_key=${PREFIX}android-e2e-timing-${{ hashFiles('e2e/mobile/specs') }}-2
```

and the restore in `generate-shards-matrix/action.yml` passes `key:` with **no `restoreKeys`**
fallback. So **changing any file under `e2e/mobile/specs` invalidates the whole timing cache**, and
the next run shards with no timing data at all — falling into this branch:

```js
return files.filter((_, i) => i % shardTotal === shardIndex - 1);
```

which is round-robin over the alphabetical file list, completely blind to duration. A run
immediately after any spec edit therefore has essentially arbitrary balance. A prefix
`restoreKeys` fallback would let it reuse the previous timing file — stale for the edited spec, but
accurate for the other 255 — and is worth considering.

## Which failure mode do we actually have?

Measured, not assumed. Replaying the real distributor against a real timing file:

```
$ node e2e/mobile/scripts/shard-balance.mjs --platform android

spec files    256 selected, 249 with timing
heaviest file addAccountTON.spec.ts at 6.7m

shards   slowest    mean   imbalance   vs 12 shards
     8     58.2m    57.8m       1.005          1.50x
    12     38.7m    38.6m       1.003          1.00x
    16     29.2m    28.9m       1.011          0.76x
    20     23.5m    23.1m       1.017          0.61x
    24     19.7m    19.3m       1.024          0.51x
    30     15.9m    15.4m       1.033          0.41x
    40     12.1m    11.6m       1.047          0.31x
```

`imbalance` is the slowest shard divided by a mathematically perfect average — 1.000 is the best
any algorithm could possibly do, because the work is what it is.

It sits at **1.003–1.047 from 8 to 40 shards**. The packer is within a few percent of optimal at
every count, so **(b) is ruled out**: there is nothing meaningful to win by improving the
distribution algorithm. Only the shard count moves the slowest shard, and it does so close to
linearly — 12 → 20 shards is 0.61x.

If someone proposes rewriting the sharding algorithm, this is the answer: the headroom is 1-5%,
not 40%.

## The hard floor: one file cannot be split

Because distribution is per file, **the heaviest single spec file is a floor no shard count can
beat.** iOS shows this clearly, where `swapDeeplinks.spec.ts` is 16.3m on its own:

```
$ node e2e/mobile/scripts/shard-balance.mjs --platform ios

heaviest file swapDeeplinks.spec.ts at 16.3m

shards   slowest    mean   imbalance   vs 12 shards
    12     27.8m    27.5m       1.010          1.00x
    16     20.9m    20.6m       1.013          0.75x
    20     16.7m    16.5m       1.011          0.60x
    24     16.3m    13.8m       1.187          0.59x  <- at floor
    30     16.3m    11.0m       1.484          0.59x  <- at floor
    40     16.3m     8.3m       1.978          0.59x  <- at floor
```

Past ~20 shards iOS stops improving entirely. The imbalance figure climbing to 1.978 is not the
packer degrading — it is one file towering over an ever-smaller average. Adding shard 41 changes
nothing.

So **splitting the heaviest spec files is a prerequisite for raising the shard count, not an
alternative to it.** Which file that is depends on the current timing data, which is why the tool
prints it rather than this document naming a fixed number.

## Per-shard setup is a fixed cost on top

Every figure above is test time only. Each shard also pays setup before Detox starts — measured at
roughly 2.2m on Android and 6.0m on iOS — and that **does not shrink when you add shards**. At 40
shards it would be paid 40 times.

Two consequences: the real slowest-shard time is the table value plus setup, and cheaper setup is
what makes a higher shard count affordable.

## Checking it yourself

```bash
# needs a timing file at e2e/mobile/artifacts/e2e-test-results-<platform>.json —
# download the artifact of any completed run, or copy one from a local run
node e2e/mobile/scripts/shard-balance.mjs --platform android
node e2e/mobile/scripts/shard-balance.mjs --platform ios --counts 12,16,20
node e2e/mobile/scripts/shard-balance.mjs --platform android --filter "@NanoSP"
```

The tool imports `distributeFilesByTiming` from `shard-tests.mjs` rather than reimplementing it,
and calls it once per shard index exactly as the separate CI jobs do — so it cannot drift from what
CI actually does, and an inconsistent partition (a file duplicated or dropped across shards) is
reported as an error rather than silently averaged away.

## Gotchas

- **Shard counts are not uniform across triggers.** Manual `workflow_dispatch` on a non-release ref
  takes the `else` branch of `Calculate shard counts` in `generate-shards-matrix/action.yml`, which
  clamps iOS to 3 shards while Android still gets 12. A dispatch is therefore not comparable with a
  nightly.
- **Untimed files are invisible to balancing.** They are distributed round-robin, so if the "with
  timing" count in the tool's output is well below the selected count, treat the imbalance figure
  as optimistic.
- **`hashFiles('e2e/mobile/specs')` in the timing key** means touching one spec discards timing for
  all of them (see above).
- **Two copies of this script used to exist.** `apps/ledger-live-mobile/scripts/shard-tests.mjs`
  filtered by building a RegExp over raw file text, while the canonical
  `e2e/tooling/filter/selectSpecs.mjs` matches a declared `@`-tag or a path substring — so the same
  `test_filter` could select different specs depending on which path ran. Check which one is in
  play before trusting a filtered selection.
- **Filter matching is substring-based**, so `@NanoS` also selects every `@NanoSP` file.
