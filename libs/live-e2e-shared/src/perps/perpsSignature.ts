import { verifyTypedData } from "ethers";

export type HyperliquidSignature = { r: string; s: string; v: number };

type TypedData = {
  domain: Record<string, unknown>;
  types: Record<string, { name: string; type: string }[]>;
  message: Record<string, unknown>;
};

const strip0x = (hex: string) => (hex.startsWith("0x") ? hex.slice(2) : hex);

/** Encodes the signature as the live app does. */
export function signatureToHex({ r, s, v }: HyperliquidSignature): string {
  return `0x${strip0x(r).padStart(64, "0")}${strip0x(s).padStart(64, "0")}${v.toString(16).padStart(2, "0")}`;
}

function asTypedData(payload: unknown): TypedData {
  if (payload === null || typeof payload !== "object") throw new Error("No EIP-712 payload");
  const { domain, types, message } = payload as Partial<TypedData>;
  if (!domain || !types || !message) throw new Error("Incomplete EIP-712 payload");
  return { domain, types, message };
}

/** Throws unless `signature` over the EIP-712 payload recovers to `address`. */
export function assertSignedBy(address: string, signablePayload: unknown, signature: string) {
  const { domain, types, message } = asTypedData(signablePayload);
  // ethers derives the domain type itself.
  const { EIP712Domain: _domain, ...messageTypes } = types;
  const signer = verifyTypedData(domain, messageTypes, message, signature);
  if (signer.toLowerCase() !== address.toLowerCase()) {
    throw new Error(`Signed by ${signer}, expected ${address}`);
  }
}
