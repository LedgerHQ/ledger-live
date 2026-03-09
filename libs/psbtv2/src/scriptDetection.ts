/**
 * Script type detection for Bitcoin scriptPubKey analysis.
 * Canonical constants and helpers used by PSBT signers and wallet logic.
 */

/**
 * Script type detection constants.
 * Extracted magic bytes for scriptPubKey analysis.
 */
export const SCRIPT_CONSTANTS = {
  // P2WPKH (Native SegWit): OP_0 <20-byte-hash>
  P2WPKH: {
    LENGTH: 22,
    PREFIX: [0x00, 0x14] as const,
    SUFFIX: [] as const,
  },
  // P2TR (Taproot): OP_1 <32-byte-x-only-pubkey>
  P2TR: {
    LENGTH: 34,
    PREFIX: [0x51, 0x20] as const,
    SUFFIX: [] as const,
  },
  // P2SH (Pay-to-Script-Hash): OP_HASH160 PUSHDATA(20) <20-byte-hash> OP_EQUAL
  P2SH: {
    LENGTH: 23,
    PREFIX: [0xa9, 0x14] as const,
    SUFFIX: [0x87] as const,
  },
  // P2PKH (Legacy): OP_DUP OP_HASH160 PUSHDATA(20) <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG
  P2PKH: {
    LENGTH: 25,
    PREFIX: [0x76, 0xa9, 0x14] as const,
    SUFFIX: [0x88, 0xac] as const,
  },
} as const;

/**
 * Supported Bitcoin script types (scriptPubKey classification).
 */
export type ScriptType = "p2wpkh" | "p2tr" | "p2sh" | "p2pkh";

/**
 * Detects the script type from a scriptPubKey buffer.
 */
const SCRIPT_RULES: {
  type: ScriptType;
  spec: (typeof SCRIPT_CONSTANTS)[keyof typeof SCRIPT_CONSTANTS];
}[] = [
  { type: "p2wpkh", spec: SCRIPT_CONSTANTS.P2WPKH },
  { type: "p2tr", spec: SCRIPT_CONSTANTS.P2TR },
  { type: "p2sh", spec: SCRIPT_CONSTANTS.P2SH },
  { type: "p2pkh", spec: SCRIPT_CONSTANTS.P2PKH },
];

export function detectScriptType(scriptPubKey: Buffer): ScriptType | undefined {
  for (const { type, spec } of SCRIPT_RULES) {
    const { LENGTH, PREFIX, SUFFIX } = spec;
    if (scriptPubKey.length !== LENGTH) continue;
    if (PREFIX.some((b, i) => scriptPubKey[i] !== b)) continue;
    if (SUFFIX.some((b, i) => scriptPubKey[scriptPubKey.length - SUFFIX.length + i] !== b))
      continue;
    return type;
  }
  return undefined;
}

/**
 * Result of extracting the hash/tweaked key from a scriptPubKey.
 */
export interface ExtractHashResult {
  hashHex: string;
  scriptType: ScriptType;
}

/**
 * Extracts the hash (or P2TR tweaked key) from a scriptPubKey for lookup.
 * Returns the hex key used in hash-based maps (e.g. known address derivations).
 */
export function extractHashFromScriptPubKey(scriptPubKey: Buffer): ExtractHashResult | undefined {
  const scriptType = detectScriptType(scriptPubKey);
  if (!scriptType) return undefined;

  switch (scriptType) {
    case "p2wpkh":
      return { hashHex: scriptPubKey.subarray(2, 22).toString("hex"), scriptType };
    case "p2pkh":
      return { hashHex: scriptPubKey.subarray(3, 23).toString("hex"), scriptType };
    case "p2sh":
      return { hashHex: scriptPubKey.subarray(2, 22).toString("hex"), scriptType };
    case "p2tr":
      return { hashHex: scriptPubKey.subarray(2, 34).toString("hex"), scriptType };
    /* istanbul ignore next -- exhaustive check: default is unreachable when ScriptType is extended */
    default: {
      const _exhaustive: never = scriptType;
      return _exhaustive;
    }
  }
}
