#!/bin/sh
set -eu

# Single-validator Cosmos Hub (gaia) devnet. Unlike Babylon, Cosmos Hub staking
# is NOT x/epoching-wrapped, so delegate/undelegate/redelegate apply at the next
# block rather than the next epoch — no two-validator quorum or short-epoch
# patch is needed. One validator with 100% voting power finalises blocks alone.
CHAIN_ID="cosmos-devnet"
MONIKER="devnet"
HOME_DIR="/gaia"
KEYRING="test"
DENOM="uatom"

# Address to pre-fund at genesis. The tester generates a fresh random seed each
# run (src/signer.ts), derives this cosmos1… address, and passes it in via the
# DEV_ADDRESS env (docker-compose.gaia.yml → scenarii/Cosmos.ts). We fund the
# raw address directly — the tester's software signer (not gaiad) does signing.
DEV_ADDRESS="${DEV_ADDRESS:?DEV_ADDRESS must be set (the tester-derived cosmos1… address to fund at genesis)}"

# --default-denom makes uatom the staking/mint/gov/crisis denom across genesis
# in one flag (cosmos-sdk >= 0.47), so no jq genesis surgery is needed. The
# genesis sub-command form (`gaiad genesis ...`) is the modern cosmos-sdk
# layout; older nodes used the flat `gaiad add-genesis-account` form.
gaiad init "$MONIKER" --chain-id "$CHAIN_ID" --home "$HOME_DIR" --default-denom "$DENOM"

# Validator key lives in the in-container test keyring; only the chain itself
# needs it (for the gentx self-delegation).
gaiad keys add validator --keyring-backend "$KEYRING" --home "$HOME_DIR"

# Fund the validator (by key name) and the tester's dev account (by raw
# address). add-genesis-account accepts both forms.
gaiad genesis add-genesis-account validator "100000000000000${DENOM}" \
  --keyring-backend "$KEYRING" --home "$HOME_DIR"
gaiad genesis add-genesis-account "$DEV_ADDRESS" "1000000000000${DENOM}" \
  --home "$HOME_DIR"

# Self-delegation gentx → one bonded validator at genesis.
gaiad genesis gentx validator "10000000000${DENOM}" \
  --chain-id "$CHAIN_ID" --keyring-backend "$KEYRING" --home "$HOME_DIR"
gaiad genesis collect-gentxs --home "$HOME_DIR"

# gaia's x/feemarket (Skip's EIP-1559 fee module) enforces an on-chain min gas
# price in its OWN fee denom, which `init --default-denom` does NOT rewrite — it
# stays "stake", so broadcasting a uatom-fee tx fails with "unable to get min
# gas price for denom uatom: error resolving denom". gaia also seeds the base
# price at 1.0 uatom/gas — 500x the bridge's 0.002 rate, which would reject our
# fee as insufficient. Point feemarket at uatom, disable enforcement (devnet),
# and drop the price well under 0.002 (small positive value rather than 0 to
# clear any `> 0` genesis validation). The node-level minimum-gas-prices below
# is then the only fee floor.
GENESIS="$HOME_DIR/config/genesis.json"
TMP="$GENESIS.tmp"
jq '.app_state.feemarket.params.enabled = false
  | .app_state.feemarket.params.fee_denom = "uatom"
  | .app_state.feemarket.params.min_base_gas_price = "0.001000000000000000"
  | .app_state.feemarket.state.base_gas_price = "0.001000000000000000"' \
  "$GENESIS" > "$TMP" && mv "$TMP" "$GENESIS"

APP_TOML="$HOME_DIR/config/app.toml"
CONFIG_TOML="$HOME_DIR/config/config.toml"

# Expose LCD (REST) + Tendermint RPC on all interfaces (defaults bind to
# localhost inside the container, which the host port-forward can't reach).
sed -i 's|^enable = false|enable = true|' "$APP_TOML"
sed -i 's|^address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' "$APP_TOML"
sed -i 's|^enabled-unsafe-cors = false|enabled-unsafe-cors = true|' "$APP_TOML"
# Accept the bridge's fee (it prices gas at minGasPrice=0.002uatom); set to 0 so
# the node never rejects a transaction on its own minimum-gas-prices floor.
sed -i 's|^minimum-gas-prices = .*|minimum-gas-prices = "0uatom"|' "$APP_TOML"
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' "$CONFIG_TOML"
# Faster blocks so the scenario's delegate/claim land in seconds.
sed -i 's|^timeout_commit = .*|timeout_commit = "1s"|' "$CONFIG_TOML"

exec gaiad start --home "$HOME_DIR"
