// Web3checks transaction check for Bitcoin (spec: web3checks-backend docs/on-device/0.0.12).
// The built transaction is sent as an unsigned PSBT and the partner answers with a signed TLV
// descriptor carrying a risk score. Unlike EVM and Solana, the descriptor is consumed by the
// wallet, not by the device.
import { Psbt, Transaction as BtcTransaction } from "bitcoinjs-lib";
import network from "@ledgerhq/live-network/network";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { DerivationModes, type TransactionInfo } from "@ledgerhq/wallet-btc/types";
import type { BitcoinCoinConfig } from "./config";
import { sha256 } from "./crypto-util";

// Provisional values of the spec
const CHAIN_IDS: Record<string, number> = {
  bitcoin: 1000,
  bitcoin_testnet: 1001,
};

const TAG = {
  STRUCTURE_TYPE: 0x01,
  ADDRESS: 0x22,
  CHAIN_ID: 0x23,
  TX_HASH: 0x27,
  RISK: 0x80,
  CATEGORY: 0x81,
  PROVIDER_MESSAGE: 0x82,
  TINY_URL: 0x83,
} as const;

const STRUCTURE_TYPE_TRANSACTION_CHECK = 0x09;

// Master fingerprints are zeroed: they are shared by every account of a seed and would link
// all of a user's transactions together.
const ZERO_FINGERPRINT = new Uint8Array(4);

export const TransactionCheckRisk = {
  Benign: 0,
  Risk: 1,
  Threat: 2,
} as const;

export type TransactionCheckResult = {
  risk: number;
  category: number;
  providerMessage: string | undefined;
  reportUrl: string | undefined;
};

type ScanPsbt = { psbt: Buffer; from: string };

type ScanResponse = { public_key_id: string; descriptor: string; block: number };

type Derivation = Pick<Parameters<Psbt["addInput"]>[0], "bip32Derivation" | "tapBip32Derivation">;

export function getTransactionCheckChainId(currencyId: string): number | undefined {
  return CHAIN_IDS[currencyId];
}

async function getDerivation(
  walletAccount: WalletAccount,
  [account, index]: [number, number],
): Promise<Derivation> {
  const { xpub, params } = walletAccount;
  const pubkey = await xpub.crypto.getPubkeyAt(xpub.xpub, account, index);
  const path = `m/${params.path}/${params.index}'/${account}/${index}`;
  if (params.derivationMode === DerivationModes.TAPROOT) {
    const xOnly = pubkey.subarray(1, 33);
    return {
      tapBip32Derivation: [
        { masterFingerprint: ZERO_FINGERPRINT, pubkey: xOnly, path, leafHashes: [] },
      ],
    };
  }
  return { bip32Derivation: [{ masterFingerprint: ZERO_FINGERPRINT, pubkey, path }] };
}

/**
 * Build the unsigned PSBT (v0) of a wallet-btc transaction, without any xpub.
 * `from` is the address of the first input, all inputs belonging to the account.
 */
export async function buildScanPsbt(
  walletAccount: WalletAccount,
  txInfo: TransactionInfo,
): Promise<ScanPsbt | null> {
  const from = txInfo.inputs[0]?.address;
  if (!from) return null;

  const { derivationMode } = walletAccount.params;
  const psbt = new Psbt({ network: walletAccount.xpub.crypto.network });

  for (const [i, input] of txInfo.inputs.entries()) {
    const derivation = txInfo.associatedDerivations[i];
    if (!input.output_hash || !derivation) return null;
    const prevTx = BtcTransaction.fromHex(input.txHex);
    const prevOut = prevTx.outs[input.output_index];
    if (!prevOut) return null;

    psbt.addInput({
      hash: input.output_hash,
      index: input.output_index,
      sequence: input.sequence,
      ...(derivationMode === DerivationModes.LEGACY
        ? { nonWitnessUtxo: Buffer.from(input.txHex, "hex") }
        : { witnessUtxo: { script: prevOut.script, value: BigInt(prevOut.value) } }),
      ...(await getDerivation(walletAccount, derivation)),
    });
  }

  for (const output of txInfo.outputs) {
    psbt.addOutput({
      script: output.script,
      value: BigInt(output.value.toFixed()),
      ...(output.isChange
        ? await getDerivation(walletAccount, [
            txInfo.changeAddress.account,
            txInfo.changeAddress.index,
          ])
        : {}),
    });
  }

  return { psbt: Buffer.from(psbt.toBuffer()), from };
}

// DER-encoded tag or length: short form below 0x80, long form otherwise
function readDer(buf: Buffer, offset: number): [number, number] {
  const first = buf[offset];
  if (first === undefined) throw new Error("truncated descriptor");
  if (first < 0x80) return [first, offset + 1];
  const size = first & 0x7f;
  if (offset + 1 + size > buf.length) throw new Error("truncated descriptor");
  let value = 0;
  for (let k = 0; k < size; k++) value = value * 256 + buf[offset + 1 + k]!;
  return [value, offset + 1 + size];
}

export function decodeDescriptor(hex: string): Map<number, Buffer> {
  const buf = Buffer.from(hex.replace(/^0x/, ""), "hex");
  const fields = new Map<number, Buffer>();
  let offset = 0;
  while (offset < buf.length) {
    const [tag, afterTag] = readDer(buf, offset);
    const [length, afterLength] = readDer(buf, afterTag);
    if (afterLength + length > buf.length) throw new Error("truncated descriptor");
    fields.set(tag, buf.subarray(afterLength, afterLength + length));
    offset = afterLength + length;
  }
  return fields;
}

/**
 * Check that the descriptor answers for the PSBT we sent, then extract the risk.
 * The descriptor signature (provider certificate from the CAL) is not verified yet.
 */
export function parseDescriptor(
  hex: string,
  expected: { psbt: Buffer; from: string; chainId: number },
): TransactionCheckResult {
  const fields = decodeDescriptor(hex);
  const structureType = fields.get(TAG.STRUCTURE_TYPE);
  const txHash = fields.get(TAG.TX_HASH);
  const chainId = fields.get(TAG.CHAIN_ID);
  const address = fields.get(TAG.ADDRESS);
  const risk = fields.get(TAG.RISK);
  const category = fields.get(TAG.CATEGORY);

  if (structureType?.[0] !== STRUCTURE_TYPE_TRANSACTION_CHECK) {
    throw new Error("unexpected descriptor structure type");
  }
  if (!txHash?.equals(sha256(expected.psbt))) throw new Error("descriptor TX_HASH mismatch");
  if (!chainId || chainId.readBigUInt64BE() !== BigInt(expected.chainId)) {
    throw new Error("descriptor CHAIN_ID mismatch");
  }
  if (address?.toString("ascii") !== expected.from) throw new Error("descriptor ADDRESS mismatch");
  if (risk?.length !== 1 || category?.length !== 1) throw new Error("descriptor risk missing");

  return {
    risk: risk[0]!,
    category: category[0]!,
    providerMessage: fields.get(TAG.PROVIDER_MESSAGE)?.toString("ascii"),
    reportUrl: fields.get(TAG.TINY_URL)?.toString("ascii"),
  };
}

async function postScan(
  url: string,
  chainId: number,
  { psbt, from }: ScanPsbt,
): Promise<TransactionCheckResult> {
  const { data } = await network<ScanResponse>({
    method: "POST",
    url: `${url}/bitcoin/scan/tx`,
    data: { tx: { from, raw: psbt.toString("base64") }, chain: chainId },
  });
  return parseDescriptor(data.descriptor, { psbt, from, chainId });
}

// The built transaction is itself cached, so the same PSBT comes back on every status refresh
const cachedPostScan = makeLRUCache(
  postScan,
  (url, chainId, { psbt }) => `${url}_${chainId}_${sha256(psbt).toString("hex")}`,
  minutes(5),
);

/**
 * Screen a built transaction. Returns null when the check is disabled, not supported for the
 * currency or unavailable: a failing check must never prevent the user from sending.
 */
export async function checkTransaction(
  config: BitcoinCoinConfig,
  logger: Logger,
  currencyId: string,
  walletAccount: WalletAccount,
  txInfo: TransactionInfo,
): Promise<TransactionCheckResult | null> {
  const url = config.transactionChecks?.url;
  const chainId = getTransactionCheckChainId(currencyId);
  if (!url || chainId === undefined) return null;

  try {
    const scanPsbt = await buildScanPsbt(walletAccount, txInfo);
    if (!scanPsbt) return null;
    return await cachedPostScan(url, chainId, scanPsbt);
  } catch (error) {
    logger("bitcoin", "transaction check unavailable", error);
    return null;
  }
}
