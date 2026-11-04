// Web3checks transaction check (spec: web3checks-backend docs/on-device/0.0.12).
// The coin module serializes the built transaction (see `getTransactionCheckPayload` bridge
// extension) and the partner answers with a signed TLV descriptor carrying a risk score, which is
// consumed by the wallet, not by the device.
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import network from "@ledgerhq/live-network/network";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { TransactionCheckPayload } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "../types";

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

// Public token identifying Ledger Wallet, the one the EVM and Solana signers give the DMK
const ORIGIN_TOKEN = "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5"; // gitleaks:allow

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

type ScanResponse = { public_key_id: string; descriptor: string; block: number };

export type TransactionCheckConfig = {
  /** Base URL, e.g. https://global.api.prd.ledger.com/transaction-checks/v3 */
  url: string;
  /** Chain id of the currency in the web3checks spec, sent with the scan and in the descriptor */
  chainId: number;
};

/**
 * `transactionChecks` of `config_currency_<id>`. The check is off unless both the url and the
 * chain id are set.
 */
export function getTransactionCheckConfig(
  currency: CryptoCurrency,
): TransactionCheckConfig | undefined {
  const currencyConfig = LiveConfig.getValueByKey(`config_currency_${currency.id}`);
  const { url, chainId } = currencyConfig?.transactionChecks ?? {};
  if (typeof url !== "string" || url === "" || typeof chainId !== "number") return undefined;
  return { url, chainId };
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
 * Check that the descriptor answers for the transaction we sent, then extract the risk.
 * The descriptor signature (provider certificate from the CAL) is not verified yet.
 */
export function parseDescriptor(
  hex: string,
  expected: Pick<TransactionCheckPayload, "from" | "txHash"> & { chainId: number },
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
  if (txHash?.toString("hex") !== expected.txHash.toLowerCase()) {
    throw new Error("descriptor TX_HASH mismatch");
  }
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
  { url, chainId }: TransactionCheckConfig,
  payload: TransactionCheckPayload,
): Promise<TransactionCheckResult> {
  const { chain, from, raw, txHash } = payload;
  const { data } = await network<ScanResponse>({
    method: "POST",
    url: `${url.replace(/\/+$/, "")}/${chain}/scan/tx`,
    headers: { "X-Ledger-Client-Origin": ORIGIN_TOKEN },
    data: { tx: { from, raw }, chain: chainId },
  });
  return parseDescriptor(data.descriptor, { from, txHash, chainId });
}

// The built transaction is usually cached by the coin module, so the same payload comes back on
// every status refresh
const cachedPostScan = makeLRUCache(
  postScan,
  ({ url, chainId }, { chain, txHash }) => `${url}_${chain}_${chainId}_${txHash}`,
  minutes(5),
);

/**
 * Screen a built transaction. Returns null when the check is unavailable: a failing check must
 * never prevent the user from sending.
 */
export async function checkTransaction(
  config: TransactionCheckConfig,
  payload: TransactionCheckPayload,
): Promise<TransactionCheckResult | null> {
  try {
    return await cachedPostScan(config, payload);
  } catch (error) {
    log("transaction-check", "transaction check unavailable", {
      chain: payload.chain,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : undefined,
    });
    return null;
  }
}
