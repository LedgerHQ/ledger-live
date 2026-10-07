import { ALEO_LOCAL_NODE } from "./constants";
import { advanceBlocks, broadcastTransaction, getProgramSource } from "./devnode";
import { GENESIS_ACCOUNT } from "./fixtures";
import { loadAleoWasm } from "./wasm";

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
  // Puts the mint behind the tip, where a record store's watermark-driven scan reads it.
  await advanceBlocks(1);
}
