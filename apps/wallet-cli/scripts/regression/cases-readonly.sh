# Suite D — regression of every path that needs NO device: session, balances,
# operations, assets, earn read paths, swap quote, and all `--dry-run` builders.
# Runs against the developer's REAL session (labels are discovered dynamically),
# reads live backends, and never signs or broadcasts.

# Filled by suite_d_prepare from `session view --output json`.
ETH_LABEL=""; SOL_LABEL=""; BTC_LABEL=""
ETH_ADDR=""

suite_d_prepare() {
  real_env
  cli session view --output json
  if [ "$RC" != 0 ] || ! printf '%s' "$OUT" | jq -e . >/dev/null 2>&1; then
    echo "${c_red}Cannot read the session — Suite D needs discovered accounts.${c_off}" >&2
    return 1
  fi
  local labels; labels=$(printf '%s' "$OUT" | jq -r '.accounts[].label')
  ETH_LABEL=$(printf '%s\n' "$labels" | grep -E '^ethereum-[0-9]+$'   | head -1)
  SOL_LABEL=$(printf '%s\n' "$labels" | grep -E '^solana-[0-9]+$'     | head -1)
  BTC_LABEL=$(printf '%s\n' "$labels" | grep -E '^bitcoin-.*[0-9]+$'  | head -1)
  # A safe dry-run recipient: one of our own ethereum addresses, so even a
  # mis-typed real send would only be a self-transfer. `session view` exposes
  # descriptors (`account:1:address:<net>:main:<address>:<path>`), not addresses,
  # so the address is taken from field 5 of a *different* ethereum account.
  ETH_ADDR=$(printf '%s' "$OUT" | jq -r --arg l "$ETH_LABEL" \
    '[.accounts[] | select(.label != $l) | select(.descriptor | test(":address:ethereum:main:")) | .descriptor][0] // empty' \
    | cut -d: -f6)
  [ -n "$ETH_ADDR" ] || ETH_ADDR=$(printf '%s' "$OUT" | jq -r --arg l "$ETH_LABEL" \
    '[.accounts[] | select(.label == $l) | .descriptor][0]' | cut -d: -f6)
  ADDR_OF() { # ADDR_OF <label> — address embedded in that account's descriptor
    printf '%s' "$SESSION_JSON" | jq -r --arg l "$1" \
      '[.accounts[] | select(.label == $l) | .descriptor][0] // empty' | cut -d: -f6
  }
  SESSION_JSON="$OUT"
  echo "  ${c_dim}session labels: eth=$ETH_LABEL sol=$SOL_LABEL btc=$BTC_LABEL recipient=$ETH_ADDR${c_off}"
}

suite_d() {
  suite_d_prepare || return 1
  real_env

  # ---- D1/D2: session view ----------------------------------------------------
  case_start D1 "session view lists labels and descriptors"
  cli session view
  assert_rc 0 "$RC"
  assert_has "$OUT" "$ETH_LABEL" "stdout"
  assert_has "$OUT" "account:1:" "stdout"
  case_end

  case_start D2 "session view --output json envelope"
  cli session view --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.status' 'success'
  assert_jq "$OUT" '.command' 'session view'
  assert_jq_true "$OUT" '.accounts | length > 0'
  assert_jq_true "$OUT" '.accounts[0] | has("label") and has("descriptor")'
  # v1 hardening: no raw xprv/extended private keys ever surface
  assert_lacks "$OUT" "xprv" "stdout"
  case_end

  # ---- D3..D6: balances -------------------------------------------------------
  case_start D3 "balances (ethereum) prints native + token balances"
  cli balances "$ETH_LABEL"
  assert_rc 0 "$RC"
  assert_has "$OUT" "ETH" "stdout"
  case_end

  case_start D4 "balances --output json shape ({asset, amount} rows)"
  cli balances "$ETH_LABEL" --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.status' 'success'
  assert_jq "$OUT" '.command' 'balances'
  assert_jq "$OUT" '.network' 'ethereum:main'
  assert_jq_true "$OUT" '.balances | length >= 1'
  assert_jq_true "$OUT" '.balances[0] | has("asset") and has("amount")'
  assert_jq_true "$OUT" '[.balances[] | select(.asset == "ethereum")] | length == 1'
  assert_jq_true "$OUT" '.balances[] | select(.asset == "ethereum") | .amount | test(" ETH$")'
  case_end

  if [ -n "$SOL_LABEL" ]; then
    case_start D5 "balances (solana) works for a non-EVM account"
    cli balances "$SOL_LABEL" --output json
    assert_rc 0 "$RC"; assert_json "$OUT"
    assert_jq_true "$OUT" '[.balances[] | select(.amount | test(" SOL$"))] | length == 1'
    case_end
  else case_skip D5 "balances (solana)" "no solana account in session"; fi

  if [ -n "$BTC_LABEL" ]; then
    case_start D6 "balances (bitcoin) works for a UTXO account"
    cli balances "$BTC_LABEL" --output json
    assert_rc 0 "$RC"; assert_json "$OUT"
    assert_jq_true "$OUT" '[.balances[] | select(.amount | test(" BTC$"))] | length == 1'
    case_end
  else case_skip D6 "balances (bitcoin)" "no bitcoin account in session"; fi

  case_start D7 "unknown session label fails with actionable guidance"
  cli balances no-such-label-9
  assert_rc 1 "$RC"
  assert_has "$OUT$ERR" "No account labeled" "output"
  assert_has "$OUT$ERR" "account discover" "output"
  case_end

  case_start D8 "raw account descriptors are rejected as arguments"
  cli balances "account:1:address:ethereum:main:0x0000000000000000000000000000000000000000:m/44h/60h/0h/0/0"
  assert_rc_nonzero "$RC"
  case_end

  # ---- D9..D11: operations ----------------------------------------------------
  case_start D9 "operations --limit returns rows and a pagination cursor"
  cli operations "$ETH_LABEL" --limit 3
  assert_rc 0 "$RC"
  assert_nonempty "$OUT$ERR" "output"
  case_end

  case_start D10 "operations --output json exposes nextCursor"
  cli operations "$ETH_LABEL" --limit 3 --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.command' 'operations'
  assert_jq_true "$OUT" '.operations | type == "array"'
  case_end

  # Pagination needs an account whose history is longer than the page size; with a
  # short history the backend legitimately returns no cursor, so pick the account
  # with the most operations and skip (not fail) when none paginates.
  local page_label="" cur="" first=""
  for cand in $(printf '%s' "$SESSION_JSON" | jq -r '.accounts[].label'); do
    case "$cand" in ethereum-*|solana-*|bitcoin-*) : ;; *) continue ;; esac
    cli operations "$cand" --limit 2 --output json
    [ "$RC" = 0 ] || continue
    cur=$(printf '%s' "$OUT" | jq -r '.nextCursor // empty')
    if [ -n "$cur" ]; then
      page_label="$cand"; first=$(printf '%s' "$OUT" | jq -r '.operations[0].hash // empty'); break
    fi
  done
  if [ -n "$page_label" ]; then
    case_start D11 "operations pagination: --cursor advances the page ($page_label)"
    cli operations "$page_label" --limit 2 --cursor "$cur" --output json
    assert_rc 0 "$RC"; assert_json "$OUT"
    local second; second=$(printf '%s' "$OUT" | jq -r '.operations[0].hash // empty')
    [ -n "$second" ] && [ "$first" != "$second" ] || fail_case "cursor page did not advance ($first vs $second)"
    case_end
  else
    case_skip D11 "operations pagination" "no session account has more than one page of history"
  fi

  # ---- D12..D15: assets -------------------------------------------------------
  case_start D12 "assets token resolves USDT by contract address"
  cli assets token ethereum 0xdac17f958d2ee523a2206206994597c13d831ec7
  assert_rc 0 "$RC"
  assert_has "$OUT" "USDT" "stdout"
  assert_has "$OUT" "ethereum/erc20/usd_tether__erc20_" "stdout"
  case_end

  case_start D13 "assets token-by-id round-trips the same id"
  cli assets token-by-id ethereum/erc20/usd_tether__erc20_ --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq_true "$OUT" '.. | objects | select(has("ticker")) | .ticker == "USDT"'
  case_end

  case_start D14 "assets token for an unknown contract exits non-zero"
  cli assets token ethereum 0x0000000000000000000000000000000000000001
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "not found" "output"
  case_end

  case_start D15 "assets token resolves a non-EVM (solana) mint by address"
  cli assets token solana EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  assert_rc 0 "$RC"
  assert_has "$OUT" "USDC" "stdout"
  case_end

  case_start D15b "assets token with a missing positional prints usage, not a stack trace"
  cli assets token solana
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "Usage: assets token <network> <address>" "output"
  case_end

  # ---- D16..D20: earn read paths ---------------------------------------------
  case_start D16 "earn yields (no network) lists supported networks with deeplinks"
  cli earn yields
  assert_rc 0 "$RC"
  assert_has "$OUT" "ledgerlive://" "stdout"
  case_end

  case_start D17 "earn yields -n solana surfaces --product validator targets"
  cli earn yields -n solana
  assert_rc 0 "$RC"
  assert_has "$OUT" "Deposit targets" "stdout"
  assert_has "$OUT" "--product" "stdout"
  assert_has "$OUT" "Ledger by" "stdout"
  case_end

  case_start D18 "earn yields -n ethereum surfaces vault ids as --product"
  cli earn yields -n ethereum --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq_true "$OUT" '[.. | objects | select(has("vaultId")) | .vaultId] | length > 0'
  case_end

  case_start D19 "earn yields --limit and --all are accepted"
  cli earn yields -n solana --limit 3
  assert_rc 0 "$RC"
  cli earn yields --all
  assert_rc 0 "$RC"
  case_end

  if [ -n "$SOL_LABEL" ]; then
    case_start D20 "earn positions (solana) returns positions and/or on-chain stakes"
    cli earn positions "$SOL_LABEL" --output json
    assert_rc 0 "$RC"
    assert_json "$OUT"
    assert_jq "$OUT" '.command' 'earn positions'
    assert_jq_true "$OUT" '(.positions | type == "array")'
    case_end

    case_start D21 "earn positions --fresh is accepted and stays non-blocking"
    cli earn positions "$SOL_LABEL" --fresh
    assert_rc 0 "$RC"
    case_end
  else
    case_skip D20 "earn positions (solana)" "no solana account"
    case_skip D21 "earn positions --fresh" "no solana account"
  fi

  case_start D22 "earn positions (ethereum) works"
  cli earn positions "$ETH_LABEL" --output json
  assert_rc 0 "$RC"; assert_json "$OUT"
  case_end

  # ---- D23..D30: send --dry-run (no device, nothing broadcast) ---------------
  case_start D23 "send --dry-run (native ETH) builds a transaction and shows fees"
  cli send "$ETH_LABEL" --to "$ETH_ADDR" --amount "0.0001 ETH" --dry-run
  assert_rc 0 "$RC"
  assert_has "$OUT$ERR" "0.0001 ETH" "output"
  assert_has "$OUT$ERR" "Fees" "output"
  assert_lacks "$OUT$ERR" "hash:" "output (nothing may be broadcast in a dry run)"
  case_end

  case_start D24 "send --dry-run (ERC-20) resolves the token by ticker"
  cli balances "$ETH_LABEL" --output json
  # `amount` is a display string ("8.0232 USDC"): take the ticker of the first
  # non-native row whose numeric part is > 0.
  local tok; tok=$(printf '%s' "$OUT" | jq -r '
    [.balances[] | select(.asset != "ethereum")
      | (.amount | split(" ")) as $p
      | select((($p[0] | gsub(",";"")) | tonumber? // 0) > 0)
      | $p[1]][0] // empty')
  if [ -n "$tok" ]; then
    cli send "$ETH_LABEL" --to "$ETH_ADDR" --amount "0.01 $tok" --dry-run
    assert_rc 0 "$RC"
    assert_has "$OUT$ERR" "$tok" "output"
  else
    fail_case "no funded ERC-20 in $ETH_LABEL — run this case on a token-funded account"
  fi
  case_end

  case_start D25 "send --amount without a ticker is rejected"
  cli send "$ETH_LABEL" --to "$ETH_ADDR" --amount "0.0001" --dry-run
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "must include a ticker" "output"
  case_end

  case_start D26 "send with an unknown ticker lists the account's tickers"
  cli send "$ETH_LABEL" --to "$ETH_ADDR" --amount "1 UNKN" --dry-run
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "not found in account" "output"
  assert_has "$OUT$ERR" "Available:" "output"
  case_end

  case_start D27 "send above balance surfaces NotEnoughBalance"
  cli send "$ETH_LABEL" --to "$ETH_ADDR" --amount "999999 ETH" --dry-run
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "NotEnoughBalance" "output"
  case_end

  # Address validation now goes through the CoinModuleApi instance (2.1.0 change):
  # exercise it once per family.
  case_start D28 "invalid recipient is rejected (ethereum) — validateAddress via CoinModuleApi"
  cli send "$ETH_LABEL" --to 0xnotanaddress --amount "0.0001 ETH" --dry-run
  assert_rc_nonzero "$RC"
  assert_has "$OUT$ERR" "InvalidAddress" "output"
  case_end

  if [ -n "$BTC_LABEL" ]; then
    # A UTXO descriptor carries an xpub, not a spendable address, so the positive
    # bitcoin dry run (with --fee-per-byte/--rbf) lives in the manual suite, where
    # `receive` has produced a real address. Here we cover validation + flag parsing.
    case_start D29 "invalid recipient is rejected (bitcoin) and fee flags parse"
    cli send "$BTC_LABEL" --to bc1qinvalidaddress --amount "0.0001 BTC" --dry-run
    assert_rc_nonzero "$RC"
    assert_has "$OUT$ERR" "InvalidAddress" "output"
    cli send "$BTC_LABEL" --to bc1qinvalidaddress --amount "0.0001 BTC" --fee-per-byte 5 --rbf --dry-run
    assert_has "$OUT$ERR" "InvalidAddress" "output"
    assert_lacks "$OUT$ERR" "Unknown option" "output"
    case_end
  else case_skip D29 "bitcoin validation + fee flags" "no bitcoin account"; fi

  if [ -n "$SOL_LABEL" ]; then
    case_start D30 "invalid recipient is rejected (solana) + --memo accepted in a dry run"
    cli send "$SOL_LABEL" --to notasolanaaddress --amount "0.001 SOL" --dry-run
    assert_rc_nonzero "$RC"
    assert_has "$OUT$ERR" "InvalidAddress" "output"
    local soladdr; soladdr=$(ADDR_OF "$SOL_LABEL")
    cli send "$SOL_LABEL" --to "$soladdr" --amount "0.0001 SOL" --memo "nr-2.1.0" --dry-run
    assert_lacks "$OUT$ERR" "Unknown option" "output"
    assert_lacks "$OUT$ERR" "hash:" "output (dry run must not broadcast)"
    case_end
  else case_skip D30 "solana validation + --memo" "no solana account"; fi

  # ---- D31..D33: earn dry runs ------------------------------------------------
  if [ -n "$SOL_LABEL" ]; then
    case_start D31 "earn deposit --dry-run (solana stake) validates without signing"
    cli earn yields -n solana --output json
    local validator; validator=$(printf '%s' "$OUT" | jq -r '[.. | objects | select(has("validator")) | .validator][0] // empty')
    if [ -n "$validator" ]; then
      cli earn deposit "$SOL_LABEL" --product "$validator" --amount "0.5 SOL" --dry-run
      assert_lacks "$OUT$ERR" "Unknown option" "output"
      assert_lacks "$OUT$ERR" "hash:" "output (dry run must not broadcast)"
    else
      fail_case "no validator returned by earn yields -n solana"
    fi
    case_end
  else case_skip D31 "earn deposit --dry-run (solana)" "no solana account"; fi

  case_start D32 "earn deposit --dry-run (ethereum vault) reports the approve/deposit split"
  cli earn yields -n ethereum --output json
  local vault; vault=$(printf '%s' "$OUT" | jq -r '[.. | objects | select(has("vaultId")) | .vaultId][0] // empty')
  if [ -n "$vault" ]; then
    cli earn deposit "$ETH_LABEL" --product "$vault" --amount "1 USDC" --dry-run
    assert_lacks "$OUT$ERR" "Unknown option" "output"
    assert_lacks "$OUT$ERR" "hash:" "output (dry run must not broadcast)"
  else
    fail_case "no vaultId returned by earn yields -n ethereum"
  fi
  case_end

  case_start D33 "earn withdraw --dry-run rejects a missing target"
  cli earn withdraw "$ETH_LABEL" --dry-run
  assert_rc_nonzero "$RC"
  case_end

  # ---- D34..D38: swap quote ---------------------------------------------------
  case_start D34 "swap quote (ETH -> BTC) queries providers and reports per-provider outcomes"
  if [ -n "$BTC_LABEL" ]; then
    cli swap quote --from ethereum --to bitcoin --amount 0.05 --from-account "$ETH_LABEL" --to-account "$BTC_LABEL"
    assert_rc 0 "$RC"
    assert_nonempty "$OUT$ERR" "output"
    printf '%s' "$OUT$ERR" | grep -qiE "rate|no quotes available" || fail_case "no rate lines and no explicit 'No quotes available'"
  else fail_case "no bitcoin account for the ETH->BTC quote"; fi
  case_end

  case_start D35 "swap quote --output json shape"
  cli swap quote --from ethereum --to bitcoin --amount 0.05 --from-account "$ETH_LABEL" --to-account "$BTC_LABEL" --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.command' 'swap quote'
  case_end

  case_start D36 "swap quote accepts a token currency id"
  cli swap quote --from ethereum/erc20/usd_tether__erc20_ --to ethereum --amount 50 --from-account "$ETH_LABEL" --to-account "$ETH_LABEL" --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  case_end

  case_start D37 "swap quote with a missing required flag fails cleanly"
  cli swap quote --from ethereum --to bitcoin --amount 0.05 --from-account "$ETH_LABEL"
  assert_rc_nonzero "$RC"
  assert_lacks "$OUT$ERR" "[object Object]" "output"
  case_end

  case_start D38 "swap quote with an unknown currency id fails cleanly"
  cli swap quote --from not-a-currency --to bitcoin --amount 0.05 --from-account "$ETH_LABEL" --to-account "$BTC_LABEL"
  assert_rc_nonzero "$RC"
  assert_lacks "$OUT$ERR" "[object Object]" "output"
  case_end

  # Documented behaviour: an id the provider does not know is reported as UNKNOWN
  # with exit 0 (it is a status read, not a failure). What must not happen is a
  # crash or an unrendered error object.
  case_start D39 "swap status reports UNKNOWN for an unknown swap id without crashing"
  cli swap status --swap-id nr-2-1-0-does-not-exist --provider changelly
  assert_rc 0 "$RC"
  assert_has "$OUT" "UNKNOWN" "stdout"
  assert_lacks "$OUT$ERR" "[object Object]" "output"
  case_end

  case_start D39b "swap status with a missing --provider fails cleanly"
  cli swap status --swap-id nr-2-1-0-does-not-exist
  assert_rc_nonzero "$RC"
  assert_lacks "$OUT$ERR" "[object Object]" "output"
  case_end

  # ---- D40: version / help surface -------------------------------------------
  case_start D40 "--version reports $EXPECTED_VERSION and --help lists every command group"
  cli --version
  assert_rc 0 "$RC"
  assert_has "$OUT" "$EXPECTED_VERSION" "stdout"
  cli --help
  assert_rc 0 "$RC"
  for grp in account session balances operations receive send swap earn ring skill genuine-check assets; do
    assert_has "$OUT$ERR" "$grp" "--help output (missing $grp)"
  done
  case_end
}
