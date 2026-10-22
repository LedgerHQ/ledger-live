import { getTronRpc } from "./fixtures";

/** Resolves once the node has put the transaction in a block. */
export async function waitForOperationInclusion(txID: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${getTronRpc()}/wallet/gettransactioninfobyid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: txID }),
      });
      const info = res.ok ? ((await res.json()) as { id?: string; blockNumber?: number }) : null;
      if (info?.id === txID && info.blockNumber !== undefined) return;
    } catch {
      // The node may not answer yet: try again until the deadline
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for tx ${txID} to be included`);
}
