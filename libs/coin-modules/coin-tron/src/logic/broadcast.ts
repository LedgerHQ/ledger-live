import { broadcastHexTron, broadcastTron } from "../network";

type TxObject = {
  txID: string;
  raw_data: Record<string, unknown> | undefined;
  signature: string[];
};

export async function broadcast(transaction: string | TxObject): Promise<string> {
  if (typeof transaction === "string") {
    const { rawTx, signature } = extractTxAndSignature(transaction);
    // Broadcast the signed bytes verbatim: a protobuf round-trip of `raw_data` is lossy
    // for TRC10/TRC20 contracts and would invalidate the signature.
    return broadcastHexTron(buildSignedTransactionHex(rawTx, signature));
  } else {
    return broadcastTron(transaction);
  }
}

const isHex = (value: string): boolean => value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value);

// Parses the `combine` output: a 4-hex-char length prefix, the raw_data hex, then the signature hex.
// Reject malformed input up front so a bad payload fails deterministically instead of being
// silently truncated by Buffer.from(hex) and broadcast as garbage.
function extractTxAndSignature(transaction: string): { rawTx: string; signature: string } {
  const txLength = parseInt(transaction.slice(0, 4), 16);
  const rawTx = transaction.slice(4, txLength + 4);
  const signature = transaction.slice(4 + txLength);
  if (Number.isNaN(txLength) || rawTx.length !== txLength || !isHex(rawTx) || !isHex(signature)) {
    throw new Error("tron: malformed signed transaction payload");
  }
  return { rawTx, signature };
}

// Wrap the signed `raw_data` (field 1) and signature (field 2) into a full
// `Transaction` hex without re-encoding, so the signed bytes stay intact.
function buildSignedTransactionHex(rawTxHex: string, signatureHex: string): string {
  const rawData = Buffer.from(rawTxHex, "hex");
  const signature = Buffer.from(signatureHex, "hex");
  return Buffer.concat([
    Buffer.from([0x0a]), // field 1 (raw_data), wire type 2 (length-delimited)
    encodeVarint(rawData.length),
    rawData,
    Buffer.from([0x12]), // field 2 (signature), wire type 2 (length-delimited)
    encodeVarint(signature.length),
    signature,
  ]).toString("hex");
}

function encodeVarint(value: number): Buffer {
  const bytes: number[] = [];
  let remaining = value;
  while (remaining > 0x7f) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  bytes.push(remaining);
  return Buffer.from(bytes);
}
