#!/bin/sh
set -eu

# Single-validator Gonka devnet. Gonka's PoC validator set overrides x/staking
# (delegation is rejected outright), so this devnet only needs to produce
# blocks — it doesn't need a workable staking flow. Bootstrapping still goes
# through the chain's own gentx/collect-gentxs/patch-genesis sequence because
# CometBFT needs a bonded validator to reach quorum, mirroring the runtime's
# own inference-chain/scripts/init-docker-genesis.sh.
CHAIN_ID="gonka-devnet"
MONIKER="devnet"
HOME_DIR="/root/.inference"
KEYRING="test"
DENOM="ngonka"

# Address to pre-fund at genesis. The tester generates a fresh random seed each
# run (src/signer.ts), derives this gonka1… address, and passes it in via the
# DEV_ADDRESS env (docker-compose.gonka.yml → scenarii/Gonka.ts). We fund the
# raw address directly — the tester's software signer (not inferenced) does
# signing.
DEV_ADDRESS="${DEV_ADDRESS:?DEV_ADDRESS must be set (the tester-derived gonka1… address to fund at genesis)}"

# --default-denom makes ngonka the staking/mint/gov/crisis denom across genesis
# in one flag (cosmos-sdk >= 0.47), so no jq genesis surgery is needed for that
# part. The genesis sub-command form (`inferenced genesis ...`) is the modern
# cosmos-sdk layout Gonka's fork carries forward.
inferenced init "$MONIKER" --chain-id "$CHAIN_ID" --home "$HOME_DIR" --default-denom "$DENOM"

# --default-denom does NOT populate bank.denom_metadata. The chain's own
# x/inference module reads it at genesis (InitHoldingAccounts looks up
# types.BaseCoin = "ngonka" via the bank keeper) and panics with "BaseCoin
# denom not found" if it's missing — this is required, not cosmetic. Content
# mirrors the runtime's own inference-chain/denom.json.
GENESIS="$HOME_DIR/config/genesis.json"
TMP="$GENESIS.tmp"
jq '.app_state.bank.denom_metadata = [{
  "description": "Coins for the Gonka network.",
  "base": "'"$DENOM"'",
  "display": "'"$DENOM"'",
  "name": "Gonka",
  "symbol": "GNK",
  "denom_units": [
    {"denom": "'"$DENOM"'", "exponent": 0, "aliases": ["nanogonka"]},
    {"denom": "ugonka", "exponent": 3, "aliases": ["microgonka"]},
    {"denom": "mgonka", "exponent": 6, "aliases": ["milligonka"]},
    {"denom": "gonka", "exponent": 9, "aliases": []}
  ]
}]' "$GENESIS" > "$TMP" && mv "$TMP" "$GENESIS"

# Validator key lives in the in-container test keyring; only the chain itself
# needs it (for the gentx self-delegation).
inferenced keys add validator --keyring-backend "$KEYRING" --home "$HOME_DIR"

# Gonka's `genesis gentx` is NOT the standard cosmos-sdk command: it also
# requires a second "warm" ML-operational key and emits a genparticipant tx
# (MsgSubmitNewParticipant + authz grants) alongside the classic gentx. This
# devnet never exercises PoC/ML traffic, but the warm key and --url are
# mandatory flags regardless.
inferenced keys add validator-warm --keyring-backend "$KEYRING" --home "$HOME_DIR"
WARM_ADDRESS=$(inferenced keys show validator-warm --address --keyring-backend "$KEYRING" --home "$HOME_DIR")

# Fund the validator (by key name) and the tester's dev account (by raw
# address). add-genesis-account accepts both forms. GNK has 9 decimals (vs.
# ATOM/BABY's 6), so funding the dev account to the same ~1,000,000-display-unit
# window the shared beforeAll asserts on takes three more zeros here than in
# gaiad/babylond's entrypoint.
inferenced genesis add-genesis-account validator "2000000000${DENOM}" \
  --keyring-backend "$KEYRING" --home "$HOME_DIR"
inferenced genesis add-genesis-account "$DEV_ADDRESS" "1000000000000000${DENOM}" \
  --home "$HOME_DIR"

# Self-delegation gentx + genparticipant registration. --url is a required
# flag but unused by a devnet with no ML traffic.
inferenced genesis gentx validator "1000000${DENOM}" \
  --chain-id "$CHAIN_ID" \
  --moniker "$MONIKER" \
  --url "http://localhost:9000" \
  --ml-operational-address "$WARM_ADDRESS" \
  --keyring-backend "$KEYRING" --home "$HOME_DIR"

inferenced genesis collect-gentxs --home "$HOME_DIR"
# Folds the genparticipant tx gentx wrote alongside the classic one into
# genesis.json; a no-op (prints a warning, exits 0) if none were found.
inferenced genesis patch-genesis --home "$HOME_DIR"

APP_TOML="$HOME_DIR/config/app.toml"
CONFIG_TOML="$HOME_DIR/config/config.toml"

# Expose LCD (REST) + Tendermint RPC on all interfaces (defaults bind to
# localhost inside the container, which the host port-forward can't reach).
sed -i 's|^enable = false|enable = true|' "$APP_TOML"
sed -i 's|^address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' "$APP_TOML"
sed -i 's|^enabled-unsafe-cors = false|enabled-unsafe-cors = true|' "$APP_TOML"
# Mirrors the chain's own zero-fee posture (FeeParams.MinGasPriceNgonka = 0);
# no x/feemarket module to reconcile here, unlike gaia.
sed -i 's|^minimum-gas-prices = .*|minimum-gas-prices = "0'"$DENOM"'"|' "$APP_TOML"
sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' "$CONFIG_TOML"
# Faster blocks so the send step lands in seconds.
sed -i 's|^timeout_commit = .*|timeout_commit = "1s"|' "$CONFIG_TOML"

exec inferenced start --home "$HOME_DIR"
