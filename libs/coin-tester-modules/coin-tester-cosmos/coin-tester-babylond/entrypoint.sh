#!/bin/bash
set -euo pipefail

# Single-validator devnet. One validator holds 100% of the voting power, so it
# reaches the 2/3 quorum and finalises blocks on its own — no second node, P2P
# peering, or genesis sharing needed.
CHAIN_ID="bbn-devnet"
TESTNET_DIR="/testnet"
HOME_DIR="$TESTNET_DIR/node0/babylond"
KEYRING="test"
DENOM="ubbn"

# Address to pre-fund at genesis. The tester generates a fresh random seed each
# run (src/signer.ts), derives this address, and passes it in via the
# DEV_ADDRESS env (docker-compose.yml → scenarii/Babylon.ts). We fund the raw
# address directly — no need to recover the seed inside the container, since
# the tester's software signer (not babylond) does the signing.
DEV_ADDRESS="${DEV_ADDRESS:?DEV_ADDRESS must be set (the tester-derived bbn1… address to fund at genesis)}"

# Clear any inherited BLS password so it can't shadow the password file handed
# to `start` below. `babylond testnet` writes an EIP-2335-encrypted bls_key.json
# plus a sibling bls_password.txt holding the password it used (see the
# `--bls-password-file` note further down); if a stray BABYLON_BLS_PASSWORD is
# set, `start` decrypts with it instead and panics with "invalid checksum".
unset BABYLON_BLS_PASSWORD

# `babylond testnet --v 1` bootstraps a single-validator chain in one call:
# generates the validator keys (cosmos + BLS), funds them, creates the gentx,
# collects it, and writes a complete genesis with all Babylon-specific module
# schemas (mint, btccheckpoint, btclightclient, finality, btcstaking) populated
# correctly. Using this avoids re-implementing Babylon's e2e/initialization Go
# logic in shell.
babylond testnet \
  --v 1 \
  --chain-id "$CHAIN_ID" \
  --output-dir "$TESTNET_DIR" \
  --keyring-backend "$KEYRING" \
  --time-between-blocks-seconds 1 \
  --btc-network regtest

# Add the tester's dev account on top of what testnet created. The address is
# supplied by the tester (DEV_ADDRESS); add-genesis-account accepts a raw
# bech32 address as well as a key name, so no key import is needed. It mutates
# only auth + bank balances — safe to call after testnet has finalized gentxs.
babylond add-genesis-account "$DEV_ADDRESS" "1000000000000${DENOM}" \
  --home "$HOME_DIR"

# The ONLY app_state mutation we need: short epoch so wait-for-epoch in the
# scenario completes in seconds, not minutes. Everything else stays at the
# values Babylon itself writes — no risk of schema drift.
GENESIS="$HOME_DIR/config/genesis.json"
TMP="$GENESIS.tmp"
jq '.app_state.epoching.params.epoch_interval = "10"' "$GENESIS" > "$TMP" && mv "$TMP" "$GENESIS"

# Expose LCD + Tendermint RPC on all interfaces (default binds to localhost
# inside the container, which the host port-forward can't reach).
APP_TOML="$HOME_DIR/config/app.toml"
CONFIG_TOML="$HOME_DIR/config/config.toml"
sed -i 's|^enable = false|enable = true|' "$APP_TOML"
sed -i 's|address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' "$APP_TOML"
sed -i 's|^enabled-unsafe-cors = false|enabled-unsafe-cors = true|' "$APP_TOML"
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' "$CONFIG_TOML"

# `babylond testnet` writes bls_key.json AND a sibling bls_password.txt with
# the password it used to encrypt the key (EIP-2335 format). Point start at
# that file so encryption (testnet write) and decryption (start load) use the
# same password — no "invalid checksum" mismatch.
exec babylond start \
  --home "$HOME_DIR" \
  --bls-password-file "$HOME_DIR/config/bls_password.txt"
