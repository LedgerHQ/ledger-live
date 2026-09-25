import { getProgramSource, broadcastTransaction } from "./devnode";
import { advanceBlocks } from "./stack";
import { loadAleoWasm } from "./wasm";
import { ALEO_LOCAL_NODE, GENESIS_ACCOUNT, PRIVATE_DEVNODE_FEE_RANGE } from "./fixtures";

/**
 * Mints one private credits record for `recipient` outside the bridge, via a
 * proofless `transfer_public_to_private` broadcast to the devnode, then seals
 * a block so the record becomes spendable.
 */
export async function mintPrivateRecord(recipient: string, amount: number): Promise<void> {
  const wasm = await loadAleoWasm();
  const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
    wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
    await getProgramSource("credits.aleo"),
    "transfer_public_to_private",
    [recipient, `${amount}u64`],
    0,
    undefined,
    ALEO_LOCAL_NODE,
  );
  await broadcastTransaction(transaction.toString());
  await advanceBlocks(1);
}

/** Spacing between minted record sizes, matching probes.test.ts's own hand-sized batch. */
const RECORD_SIZE_STEP = 10_000;

/**
 * Mints `count` private credits records for `recipient`, larger ones first
 * and `smallest` last. `findBestRecordForFee` always picks the smallest
 * fee-sufficient record, so pinning the smallest record deterministically is
 * what lets a test predict which record pays the fee.
 *
 * `smallest` must clear PRIVATE_DEVNODE_FEE_RANGE.max, not
 * TRANSFER_PRIVATE_BASE_FEE: the fee record pays the devnode's actual
 * `fee_private` cost through a `sub`, not the amount the bridge bills, and
 * that cost can run as high as PRIVATE_DEVNODE_FEE_RANGE.max.
 *
 * Returns the minted amounts in mint order.
 */
export async function mintPrivateRecords(params: {
  recipient: string;
  count: number;
  smallest: number;
}): Promise<number[]> {
  const { recipient, count, smallest } = params;

  if (count < 1) {
    throw new Error(`mintPrivateRecords: count must be at least 1, got ${count}`);
  }
  if (smallest < PRIVATE_DEVNODE_FEE_RANGE.max) {
    throw new Error(
      `mintPrivateRecords: smallest=${smallest} is below PRIVATE_DEVNODE_FEE_RANGE.max ` +
        `(${PRIVATE_DEVNODE_FEE_RANGE.max}); a record this small cannot cover the devnode's fee_private cost`,
    );
  }

  const larger = Array.from(
    { length: count - 1 },
    (_, index) => smallest + (index + 1) * RECORD_SIZE_STEP,
  );
  const amounts = [...larger, smallest];

  for (const amount of amounts) {
    await mintPrivateRecord(recipient, amount);
  }

  return amounts;
}
