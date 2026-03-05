import { ledgerService, RLP } from "@ledgerhq/hw-app-eth";
import { arrayify } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";

type LedgerEthTransactionService = typeof ledgerService;

const parseTransactionCelo: typeof ledgerService.parseTransaction = rawTxHex => {
  const payload = arrayify(rawTxHex);

  // Check for CIP64 transaction (type 0x7B = 123)
  if (payload[0] === 0x7b) {
    // Decode RLP (skip the 0x7B prefix byte)
    const fields = RLP.decode(payload.slice(1)) as any[];

    // Extract feeCurrency (index 9)
    const feeCurrency = fields[9];

    // Create EIP-1559 compatible array (remove feeCurrency at index 9)
    const eip1559Fields = [
      ...fields.slice(0, 9), // chainId through accessList
      ...fields.slice(10), // v, r, s (if present)
    ];

    // Re-encode as EIP-1559 (0x02 prefix)
    const eip1559Encoded = RLP.encode(eip1559Fields);
    // RLP.encode returns a hex string, so we can concatenate the type prefix
    const eip1559Hex = `0x02${eip1559Encoded.slice(2)}`;

    // Parse with ethers.js
    const parsed = ledgerService.parseTransaction(eip1559Hex);

    // Fix the hash - recalculate from original CIP64 payload
    const correctHash = keccak256(payload);

    // Add feeCurrency and restore CIP64 properties
    return {
      ...parsed,
      type: 0x7b,
      hash: correctHash, // Use correct hash from original CIP64
      feeCurrency:
        feeCurrency && feeCurrency.length > 0
          ? `0x${Buffer.from(feeCurrency).toString("hex")}`
          : "0x",
    };
  }

  // Non-CIP64: use ethers.js directly
  return ledgerService.parseTransaction(rawTxHex);
};

const resolveTransactionCelo: LedgerEthTransactionService["resolveTransaction"] = async (
  rawTxHex,
  loadConfig,
  resolutionConfig,
) => {
  return ledgerService.resolveTransaction(
    rawTxHex,
    loadConfig,
    resolutionConfig,
    parseTransactionCelo,
  );
};

export default {
  parseTransaction: parseTransactionCelo,
  resolveTransaction: resolveTransactionCelo,
  signAddressResolution: ledgerService.signAddressResolution,
  signDomainResolution: ledgerService.signDomainResolution,
} as typeof ledgerService;
