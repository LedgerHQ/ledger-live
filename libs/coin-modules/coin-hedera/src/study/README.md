# Block Consistency Study

This study monitors Hedera blocks over time to detect if block data changes after being initially fetched.

## How it works

1. Captures blocks as they are produced
2. Re-checks each block at various intervals (1min, 5min, 10min, ... up to 12h)
3. Compares the normalized block data to detect any changes
4. Logs results and saves detailed diffs when changes are detected

## Running the study

From the `coin-hedera` directory:

```bash
# Run the full study (runs for ~12 hours)
pnpm jest --testPathPatterns="study" -t "run"

# Run only the analysis (on existing results)
pnpm jest --testPathPatterns="study" -t "analyze"
```

## Output files

All output files are created in this directory:

- `results.csv` - CSV with all check results
- `results.log` - Detailed log file
- `blocks/` - Directory containing block snapshots when changes are detected
  - `blocks/<height>.0.json` - Original block
  - `blocks/<height>.<interval>.json` - Block after interval (e.g., `1h`)
  - `blocks/<height>.<interval>.diff` - Diff between original and changed block

## Check intervals

Blocks are re-checked at: 1min, 5min, 10min, 20min, 30min, 40min, 50min, 1h, 1h10, 1h20, 1h30, 1h40, 1h50, 2h, 3h, 4h, 5h, 6h, 8h, 12h
