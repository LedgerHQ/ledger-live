// Standalone preparation script — starts the local Kaspa chain and mines the setup blocks.
//
// The coin-tester scenario's setup() does this inline, so running this script separately
// is optional. It is useful for CI split (spin up infra before the test runner) or for
// manual debugging without re-running the full test suite.
//
// Usage:
//   cd libs/coin-tester-modules/coin-tester-kaspa
//   node -r ts-node/register src/preparation.ts

import { toSimnetAddress } from "./addressUtils";
import { INITIAL_FUND_SOMPI } from "./fixtures";
import { spawnKaspaNode, mineBlocks, waitForBalance } from "./kaspaNode";
import { deriveAddress, KASPA_TEST_MNEMONIC } from "./signer";

const SETUP_BLOCKS = 1200;

async function prepareKaspaNode() {
  const testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);
  const miningAddress = toSimnetAddress(testAddress);
  console.log(`testAddress (kaspa:):    ${testAddress}`);
  console.log(`miningAddress (kaspasim:): ${miningAddress}`);

  await spawnKaspaNode(miningAddress);
  console.log(`Infrastructure up. Mining ${SETUP_BLOCKS} blocks...`);

  await mineBlocks(SETUP_BLOCKS);
  console.log(`Mining complete. Waiting for indexer...`);

  await waitForBalance(testAddress, INITIAL_FUND_SOMPI);
  console.log(`Kaspa node ready. testAddress=${testAddress}`);
}

prepareKaspaNode().catch(err => {
  console.error(err);
  process.exit(1);
});
