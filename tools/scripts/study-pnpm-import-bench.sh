#!/usr/bin/env bash
# Study only (branch study/pnpm-linking, never merge): time `pnpm install` per packageImportMethod
# on one macOS VM. Every method runs on the same VM with a warm store, rotated order, page cache purged.
set -uo pipefail

METHODS=(${METHODS:-auto clone hardlink copy clone-or-copy})
REPS=${REPS:-3}
INSTALL_ARGS=${INSTALL_ARGS:---frozen-lockfile --filter=live-mobile... --filter=ledger-live --unsafe-perm --ignore-scripts}
OUT=${OUT:-bench-results}
mkdir -p "$OUT"
CSV="$OUT/results.csv"
ENVF="$OUT/env.txt"
SUMMARY=${GITHUB_STEP_SUMMARY:-/dev/stdout}

now() { perl -MTime::HiRes=time -e 'printf "%.3f\n", time'; }
used_kb() { df -k "$PWD" | awk 'NR==2{print $3}'; }
purge_cache() { sync; sudo -n /usr/sbin/purge >/dev/null 2>&1 && echo 1 || echo 0; }

clean_node_modules() {
  find . -name node_modules -type d -prune -not -path './.git/*' -exec rm -rf {} + 2>/dev/null
}

# nlink > 1 means hardlinked from the store; nlink 1 plus a small disk delta means APFS clone.
probe_file() {
  ls -d node_modules/.pnpm/typescript@*/node_modules/typescript/lib/typescript.js 2>/dev/null | head -1
}

store=$(pnpm store path)
{
  echo "date: $(date -u +%FT%TZ)"
  echo "runner: ${RUNNER_NAME:-local}"
  sw_vers 2>/dev/null
  echo "model: $(/usr/sbin/sysctl -n hw.model) ncpu: $(/usr/sbin/sysctl -n hw.ncpu) mem_gb: $(( $(/usr/sbin/sysctl -n hw.memsize) / 1073741824 ))"
  echo "pnpm: $(pnpm --version)"
  echo "configured package-import-method: $(pnpm config get package-import-method)"
  echo "env pnpm_config_package_import_method: ${pnpm_config_package_import_method:-<unset>}"
  echo "store: $store"
  echo "workspace: $PWD"
  echo "store device: $(stat -f %d "$store" 2>/dev/null || echo missing)  workspace device: $(stat -f %d "$PWD")"
  echo "store size before warm-up: $(du -sh "$store" 2>/dev/null | cut -f1 || echo none)"
  echo "fs: $(diskutil info "$PWD" 2>/dev/null | awk -F: '/File System Personality/{gsub(/^ +/,"",$2);print $2}')"
  echo "purge works: $(purge_cache)"
  df -h "$PWD"
  echo "install args: $INSTALL_ARGS"
} | tee "$ENVF"

echo "rep,order,method,install_s,rm_s,disk_delta_mb,nlink,purged,status" > "$CSV"

echo "::group::warm-up install (tops up the store from the network, default method)"
clean_node_modules
t0=$(now)
pnpm install $INSTALL_ARGS
echo "warm-up install: $(perl -e "printf '%.1f', $(now) - $t0") s" | tee -a "$ENVF"
echo "store size after warm-up: $(du -sh "$store" | cut -f1)" | tee -a "$ENVF"
echo "::endgroup::"

for ((rep = 1; rep <= REPS; rep++)); do
  n=${#METHODS[@]}
  for ((i = 0; i < n; i++)); do
    method=${METHODS[$(((i + rep - 1) % n))]}
    echo "::group::rep $rep #$((i + 1)) $method"
    t0=$(now)
    clean_node_modules
    rm_s=$(perl -e "printf '%.1f', $(now) - $t0")
    purged=$(purge_cache)
    before=$(used_kb)
    t0=$(now)
    pnpm install $INSTALL_ARGS --offline --package-import-method="$method" --reporter=append-only >"$OUT/install-$rep-$method.log" 2>&1
    status=$?
    install_s=$(perl -e "printf '%.1f', $(now) - $t0")
    sync
    delta_mb=$(( ($(used_kb) - before) / 1024 ))
    f=$(probe_file)
    nlink=$([ -n "$f" ] && stat -f %l "$f" || echo NA)
    tail -5 "$OUT/install-$rep-$method.log"
    echo "$rep,$((i + 1)),$method,$install_s,$rm_s,$delta_mb,$nlink,$purged,$status" | tee -a "$CSV"
    echo "::endgroup::"
  done
done

{
  echo "### pnpm import method on ${RUNNER_NAME:-local}"
  echo '```'
  cat "$ENVF"
  echo '```'
  echo "| rep | order | method | install s | rm node_modules s | disk Δ MB | nlink | purged | exit |"
  echo "|---|---|---|---|---|---|---|---|---|"
  tail -n +2 "$CSV" | tr ',' '|' | sed 's/^/|/; s/$/|/'
  echo
  echo "| method | median install s | median disk Δ MB |"
  echo "|---|---|---|"
  for m in "${METHODS[@]}"; do
    med=$(awk -F, -v m="$m" '$3==m && $9==0{print $4}' "$CSV" | sort -n | awk '{a[NR]=$1}END{print (NR? a[int((NR+1)/2)] : "NA")}')
    dmed=$(awk -F, -v m="$m" '$3==m && $9==0{print $6}' "$CSV" | sort -n | awk '{a[NR]=$1}END{print (NR? a[int((NR+1)/2)] : "NA")}')
    echo "| $m | $med | $dmed |"
  done
} >> "$SUMMARY"
