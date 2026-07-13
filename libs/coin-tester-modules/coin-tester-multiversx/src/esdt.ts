import { Address } from "@multiversx/sdk-core";
import { GAS_PRICE } from "@ledgerhq/coin-multiversx/constants";
import {
  SIMULATOR_URL,
  generateBlocks,
  generateBlocksUntilTxProcessed,
  simulatorGet,
} from "./chainSimulator";
import type { MultiversXSigner } from "./signer";

// The ESDT system smart contract (issuance/registration lives here), derived from its pubkey.
const ESDT_SYSTEM_SC = Address.newFromHex(
  "000000000000000000010000000000000000000000000000000000000002ffff",
).bech32();
const ISSUE_COST = "50000000000000000"; // 0.05 EGLD base issuing cost
const ISSUE_GAS_LIMIT = 60_000_000;

const toHex = (s: string): string => Buffer.from(s).toString("hex");
const toEvenHex = (n: bigint): string => {
  const h = n.toString(16);
  return h.length % 2 ? `0${h}` : h;
};

interface GatewayAccount {
  data: { account: { nonce: number } };
}
interface GatewayEsdts {
  data: { esdts: Record<string, unknown> };
}
interface GatewayConfig {
  data: { config: { erd_chain_id: string } };
}
interface GatewaySend {
  data?: { txHash?: string };
  error?: string;
}

export interface IssueEsdtParams {
  name: string;
  ticker: string;
  supply: bigint;
  decimals: number;
}

/**
 * Issue (register) a fungible ESDT via the system smart contract, signed locally.
 * Requires the ESDT SC to be enabled — advance past epoch 0 first (see `advanceToEpoch`).
 * Returns the protocol-assigned identifier (e.g. "TUSDC-2668e8").
 */
export async function issueEsdt(
  signer: MultiversXSigner,
  issuerAddress: string,
  derivationPath: string,
  { name, ticker, supply, decimals }: IssueEsdtParams,
): Promise<string> {
  const chainID = (await simulatorGet<GatewayConfig>("/network/config"))?.data.config.erd_chain_id;
  const nonce = (await simulatorGet<GatewayAccount>(`/address/${issuerAddress}`))?.data.account
    .nonce;
  const data = [
    "issue",
    toHex(name),
    toHex(ticker),
    toEvenHex(supply),
    toEvenHex(BigInt(decimals)),
    toHex("canMint"),
    toHex("true"),
  ].join("@");

  const unsigned = {
    nonce: nonce ?? 0,
    value: ISSUE_COST,
    receiver: ESDT_SYSTEM_SC,
    sender: issuerAddress,
    gasPrice: GAS_PRICE,
    gasLimit: ISSUE_GAS_LIMIT,
    data: Buffer.from(data).toString("base64"),
    chainID: chainID ?? "",
    version: 2,
    options: 1,
  };
  const signature = await signer.signTransaction(derivationPath, JSON.stringify(unsigned));

  const sent = (await fetch(`${SIMULATOR_URL}/transaction/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...unsigned, signature }),
  }).then(r => r.json())) as GatewaySend;
  const txHash = sent.data?.txHash;
  if (!txHash) throw new Error(`ESDT issue submit rejected: ${JSON.stringify(sent)}`);

  await generateBlocksUntilTxProcessed(txHash);
  await generateBlocks(6); // settle the cross-shard result that credits the issuer

  const esdts =
    (await simulatorGet<GatewayEsdts>(`/address/${issuerAddress}/esdt`))?.data.esdts ?? {};
  const identifier = Object.keys(esdts).find(k => k.startsWith(`${ticker}-`));
  if (!identifier) {
    throw new Error(`ESDT issuance did not register a token: ${JSON.stringify(esdts)}`);
  }
  return identifier;
}

/** `ELRONDesdt<identifier>` trie key (hex) where a holder's fungible balance is stored. */
function esdtStorageKey(identifier: string): string {
  return Buffer.from(`ELRONDesdt${identifier}`).toString("hex");
}

/**
 * ESDigest protobuf value (hex) for a fungible balance: field 2 (Value) length-delimited,
 * a leading 0x00 sign byte followed by the big-endian magnitude.
 * e.g. 1_000_000_000 -> "1205003b9aca00".
 */
function esdtDigestValue(balance: bigint): string {
  let magnitude = balance.toString(16);
  if (magnitude.length % 2) magnitude = `0${magnitude}`;
  const valueBytes = balance === 0n ? "00" : `00${magnitude}`;
  const len = (valueBytes.length / 2).toString(16).padStart(2, "0");
  return `12${len}${valueBytes}`;
}

/**
 * Build the `set-state` `pairs` entry that credits `balance` of a (registered) ESDT to a holder.
 * Combine with the holder's EGLD balance in a single set-state so funding stays atomic.
 */
export function makeEsdtPairs(identifier: string, balance: bigint): Record<string, string> {
  return { [esdtStorageKey(identifier)]: esdtDigestValue(balance) };
}
