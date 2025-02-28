export MAX_WORKERS=15; hyperfine --parameter-scan num_threads 1 $MAX_WORKERS 'pnpm run test -- --maxWorkers={num_threads}' -m 3 -w 1
