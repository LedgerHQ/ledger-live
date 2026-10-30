import { TronWeb } from "tronweb";
import { getTronRpc } from "./fixtures";
import type { TronTestAccount } from "./signer";

/**
 * Devnet-only staking setup that the wallet itself cannot perform.
 *
 * The wallet models `unDelegateResource` but not `delegateResource`, so a delegation has to be created
 * out of band before the undelegate row can act on it. Stake 2.0 additionally requires a resource be
 * frozen before any of it can be delegated.
 */

function tronWeb(privateKey: string): TronWeb {
  return new TronWeb({ fullHost: getTronRpc(), privateKey });
}

/** Witness addresses arrive as 41-prefixed hex on the wire; votes are addressed in base58check. */
export function toBase58Witness(address: string): string {
  if (!address) throw new Error("Empty witness address");
  if (address.startsWith("T")) return address;
  return TronWeb.address.fromHex(address);
}

async function signAndBroadcast(tw: TronWeb, tx: unknown, label: string): Promise<void> {
  const broadcast = await tw.trx.sendRawTransaction(await tw.trx.sign(tx as never));
  if (!broadcast.result) throw new Error(`${label} failed: ${JSON.stringify(broadcast)}`);
  // One block is enough for the resource accounting to become readable. Polled rather than slept:
  // the node runs under amd64 emulation here, where block production is slower than the 3s a fixed
  // wait would assume, and a wait that is merely long enough today is the flake this avoids.
  await waitForNextBlock();
}

async function currentBlockNumber(): Promise<number> {
  const res = await fetch(`${getTronRpc()}/wallet/getnowblock`, { method: "POST" });
  const body = (await res.json()) as { block_header?: { raw_data?: { number?: number } } };
  return body.block_header?.raw_data?.number ?? 0;
}

async function waitForNextBlock(timeoutMs = 60_000): Promise<void> {
  const start = await currentBlockNumber();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 500));
    if ((await currentBlockNumber()) > start) return;
  }
  throw new Error(`Devnet produced no block within ${timeoutMs}ms of a staking fixture broadcast`);
}

export async function listWitnessAddresses(): Promise<string[]> {
  const res = await fetch(`${getTronRpc()}/wallet/listwitnesses`);
  const body = (await res.json()) as { witnesses?: Array<{ address: string }> };
  const addresses = (body.witnesses ?? []).map(w => toBase58Witness(w.address));
  if (!addresses.length) throw new Error("Devnet exposes no witnesses to vote for");
  return addresses;
}

/** Stake 2.0 freeze, so there is bandwidth available to delegate. */
export async function freezeForDelegation(
  owner: TronTestAccount,
  amountSun: number,
): Promise<void> {
  const tw = tronWeb(owner.privateKey);
  const tx = await tw.transactionBuilder.freezeBalanceV2(amountSun, "BANDWIDTH", owner.address);
  await signAndBroadcast(tw, tx, "freezeForDelegation");
}

export async function delegateBandwidth(
  owner: TronTestAccount,
  receiverAddress: string,
  amountSun: number,
): Promise<void> {
  const tw = tronWeb(owner.privateKey);
  const tx = await tw.transactionBuilder.delegateResource(
    amountSun,
    receiverAddress,
    "BANDWIDTH",
    owner.address,
    false,
  );
  await signAndBroadcast(tw, tx, "delegateBandwidth");
}
