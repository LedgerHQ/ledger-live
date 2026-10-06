import { ALEO_LOCAL_NODE } from "./constants";
import { advanceBlocks, broadcastTransaction, getProgramSource } from "./devnode";
import { GENESIS_ACCOUNT } from "./fixtures";
import { loadAleoWasm } from "./wasm";

/** Returns the minting transaction's id. */
export async function mintPrivateRecord(recipient: string, amount: number): Promise<string> {
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
  // Puts the mint behind the tip, where a record store's watermark-driven scan reads it.
  await advanceBlocks(1);
  return transaction.id();
}

const RECORD_SIZE_STEP = 10_000;

/** Mints distinct-sized records, largest first. */
export async function mintPrivateRecords(params: {
  recipient: string;
  count: number;
  smallest: number;
}): Promise<void> {
  const { recipient, count, smallest } = params;

  if (count < 1) {
    throw new Error(`mintPrivateRecords: count must be at least 1, got ${count}`);
  }
  if (smallest < 1) {
    throw new Error(`mintPrivateRecords: smallest must be at least 1 microcredit, got ${smallest}`);
  }

  const larger = Array.from(
    { length: count - 1 },
    (_, index) => smallest + (index + 1) * RECORD_SIZE_STEP,
  );
  const amounts = [...larger, smallest];

  for (const amount of amounts) {
    await mintPrivateRecord(recipient, amount);
  }
}
