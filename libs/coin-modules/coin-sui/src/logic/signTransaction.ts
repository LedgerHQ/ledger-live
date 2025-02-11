import { TransactionPayloadInfo } from "../types";

type TypeRegistry = any;

const u8aConcat = (a: Uint8Array, b: Uint8Array) => [a, b];

/**
 * Serialize a signed transaction in a format that can be submitted over the
 * Node RPC Interface from the signing payload and signature produced by the
 * remote signer.
 *
 * @param unsigned - The JSON representing the unsigned transaction.
 * @param signature - Signature of the signing payload produced by the remote signer.
 * @param registry - Registry used for constructing the payload.
 */
export const signExtrinsic = async (
  unsigned: TransactionPayloadInfo,
  signature: any,
  registry: TypeRegistry,
): Promise<string> => {
  const extrinsic = registry.createType("Extrinsic", unsigned, {
    version: unsigned.version,
  });
  console.log("signExtrinsic", unsigned, signature, registry);
  if (typeof signature === "string") {
    extrinsic.addSignature(unsigned.address, Buffer.from(signature, "hex"), unsigned as any);
  } else {
    // todo: remove it after runtime upgrade
    extrinsic.addSignature(unsigned.address, signature, unsigned as any);
  }
  return extrinsic.toHex();
};

/**
 * Sign Extrinsic with a fake signature (for fees estimation).
 *
 * @param unsigned - The JSON representing the unsigned transaction.
 * @param registry - Registry used for constructing the payload.
 */
export const fakeSignExtrinsic = async (
  unsigned: TransactionPayloadInfo,
  registry: TypeRegistry,
): Promise<string> => {
  const fakeSignature = u8aConcat(new Uint8Array([1]), new Uint8Array(64).fill(0x42));
  return signExtrinsic(unsigned, fakeSignature, registry);
};
