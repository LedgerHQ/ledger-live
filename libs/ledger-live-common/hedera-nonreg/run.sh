#!/bin/sh
# usage (from libs/ledger-live-common): hedera-nonreg/run.sh "0.0.A,0.0.B@<unix seconds>,..."
# Syncs every account with develop's and this branch's Hedera code, then writes per-account reports
# to hedera-nonreg/out/report-<account>.txt. NONREG_BASE overrides develop's commit (default: the
# merge base with origin/develop).
set -eu
HERE=hedera-nonreg
DEVELOP_SRC=../coin-modules/coin-hedera/node_modules/.nonreg-develop
export ACCOUNTS="$1"
mkdir -p $HERE/out

ROOT=$(git rev-parse --show-toplevel)
BASE=${NONREG_BASE:-$(git merge-base origin/develop HEAD)}
if [ "$(cat $DEVELOP_SRC/BASE 2>/dev/null)" != "$BASE" ]; then
  rm -rf $DEVELOP_SRC
  mkdir -p $DEVELOP_SRC
  git -C "$ROOT" archive "$BASE" libs/coin-modules/coin-hedera/src |
    tar -x --strip-components=3 -C $DEVELOP_SRC
  [ -f $DEVELOP_SRC/src/logic/listOperations.v2.ts ] || { echo "could not extract develop's coin-hedera" >&2; exit 1; }
  echo "$BASE" > $DEVELOP_SRC/BASE
fi
git -C "$ROOT" archive "$BASE" libs/ledger-live-common/src/families/hedera/bridge/api.ts | tar -xO |
  sed "s#\"\.\./\.\./\.\./config\"#\"$PWD/src/config\"#" > $HERE/out/develop-api.ts
[ -s $HERE/out/develop-api.ts ] || { echo "could not extract develop's bridge api" >&2; exit 1; }

set +e
for variant in develop branch; do
  VARIANT=$variant node_modules/.bin/env-cmd -f .ci.integration.env \
    node_modules/.bin/jest --no-watchman --config $HERE/jest.config.js > $HERE/out/jest-$variant.log 2>&1 &
done
wait

for entry in $(echo "$ACCOUNTS" | tr ',' ' '); do
  account=${entry%@*}
  report=$HERE/out/report-$account.txt
  if [ ! -f $HERE/out/develop/$account.json ] || [ ! -f $HERE/out/branch/$account.json ]; then
    echo "# $account: sync failed (see jest logs)" > $report
    continue
  fi
  {
    python3 $HERE/check_chain.py $account
    echo
    python3 $HERE/compare.py $account 2>/dev/null | head -8
    echo
    python3 $HERE/presentation.py $account
  } > $report 2>&1
done
grep -h -A4 "^# " $HERE/out/report-*.txt
