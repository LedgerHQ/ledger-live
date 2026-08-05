import { TronWeb } from "tronweb";
import { TRON_LOCAL_RPC } from "./fixtures";
import type { PrefundedAccount } from "./tronbox";

/**
 * Devnet-only staking setup that the wallet itself cannot perform.
 *
 * The wallet models `unDelegateResource` but not `delegateResource`, so a delegation has to be created
 * out of band before the undelegate row can act on it — the same pattern `tokenFixtures.ts` uses to
 * issue the TRC-10 / TRC-20 assets the send rows spend. Stake 2.0 additionally requires a resource be
 * frozen before any of it can be delegated.
 */

function tronWeb(privateKey: string): TronWeb {
  return new TronWeb({ fullHost: TRON_LOCAL_RPC, privateKey });
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
  // One block is enough for the resource accounting to become readable.
  await new Promise(r => setTimeout(r, 3500));
}

export async function listWitnessAddresses(): Promise<string[]> {
  const res = await fetch(`${TRON_LOCAL_RPC}/wallet/listwitnesses`);
  const body = (await res.json()) as { witnesses?: Array<{ address: string }> };
  const addresses = (body.witnesses ?? []).map(w => toBase58Witness(w.address));
  if (!addresses.length) throw new Error("Devnet exposes no witnesses to vote for");
  return addresses;
}

/** Stake 2.0 freeze, so there is bandwidth available to delegate. */
export async function freezeForDelegation(
  owner: PrefundedAccount,
  amountSun: number,
): Promise<void> {
  const tw = tronWeb(owner.privateKey);
  const tx = await tw.transactionBuilder.freezeBalanceV2(amountSun, "BANDWIDTH", owner.address);
  await signAndBroadcast(tw, tx, "freezeForDelegation");
}

export async function delegateBandwidth(
  owner: PrefundedAccount,
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
