#!/usr/bin/env bash
#
# Build the age verification ZK circuit.
#
# Prerequisites:
#   - circom compiler installed: https://docs.circom.io/getting-started/installation/
#   - snarkjs installed globally or via npx
#   - Node.js 18+
#
# Outputs (copied to assets/zk/):
#   - ageVerification.wasm   (witness generator)
#   - ageVerification.zkey   (proving key)
#   - verification_key.json  (verification key)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$MOBILE_DIR/circuits"
BUILD_DIR="$MOBILE_DIR/circuits/build"
ASSETS_DIR="$MOBILE_DIR/assets/zk"
PTAU_URL="https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau"
PTAU_FILE="$BUILD_DIR/pot12.ptau"

echo "==> Setting up build directory"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$ASSETS_DIR"

# Install circomlib if not present
if [ ! -d "$CIRCUIT_DIR/node_modules/circomlib" ]; then
  echo "==> Installing circomlib"
  (cd "$CIRCUIT_DIR" && npm init -y --silent 2>/dev/null && npm install circomlib --silent)
fi

echo "==> Compiling circuit"
circom "$CIRCUIT_DIR/ageVerification.circom" \
  --r1cs --wasm --sym \
  -l "$CIRCUIT_DIR/node_modules" \
  -o "$BUILD_DIR"

echo "==> Downloading powers of tau (if not cached)"
if [ ! -f "$PTAU_FILE" ]; then
  curl -L -o "$PTAU_FILE" "$PTAU_URL"
fi

echo "==> Generating proving key (Groth16 setup)"
npx snarkjs groth16 setup \
  "$BUILD_DIR/ageVerification.r1cs" \
  "$PTAU_FILE" \
  "$BUILD_DIR/ageVerification_0000.zkey"

echo "==> Contributing to phase 2 ceremony (deterministic for reproducibility)"
echo "ledger-age-verification-ceremony" | npx snarkjs zkey contribute \
  "$BUILD_DIR/ageVerification_0000.zkey" \
  "$BUILD_DIR/ageVerification.zkey" \
  --name="Ledger contribution"

echo "==> Exporting verification key"
npx snarkjs zkey export verificationkey \
  "$BUILD_DIR/ageVerification.zkey" \
  "$BUILD_DIR/verification_key.json"

echo "==> Copying artifacts to assets/zk/"
cp "$BUILD_DIR/ageVerification_js/ageVerification.wasm" "$ASSETS_DIR/ageVerification.wasm"
cp "$BUILD_DIR/ageVerification.zkey" "$ASSETS_DIR/ageVerification.zkey"
cp "$BUILD_DIR/verification_key.json" "$ASSETS_DIR/verification_key.json"

echo "==> Verifying circuit (sanity check with test input)"
echo '{"dateOfBirth": 19900115, "currentDate": 20260404, "minimumAge": 18}' > "$BUILD_DIR/input.json"
npx snarkjs wtns calculate \
  "$BUILD_DIR/ageVerification_js/ageVerification.wasm" \
  "$BUILD_DIR/input.json" \
  "$BUILD_DIR/witness.wtns"
npx snarkjs groth16 prove \
  "$BUILD_DIR/ageVerification.zkey" \
  "$BUILD_DIR/witness.wtns" \
  "$BUILD_DIR/proof.json" \
  "$BUILD_DIR/public.json"
npx snarkjs groth16 verify \
  "$BUILD_DIR/verification_key.json" \
  "$BUILD_DIR/public.json" \
  "$BUILD_DIR/proof.json"

echo ""
echo "=== Build complete ==="
echo "Artifacts in: $ASSETS_DIR"
ls -lh "$ASSETS_DIR"
