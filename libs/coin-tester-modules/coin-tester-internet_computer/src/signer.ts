import { createHash } from "crypto";
import { Cbor, IC_REQUEST_DOMAIN_SEPARATOR, requestIdOf } from "@icp-sdk/core/agent";
import { Secp256k1KeyIdentity } from "@icp-sdk/core/identity/secp256k1";
import { AccountIdentifier } from "@ledgerhq/coin-internet_computer/logic/accountIdentifier";
import type { ICPGetAddrResponse, ICPSigner } from "@ledgerhq/coin-internet_computer/types/signer";

const SW_OK = 0x9000;

/** One key per derivation path, the same on every run. */
export const identityAt = (path: string): Secp256k1KeyIdentity =>
  Secp256k1KeyIdentity.fromSecretKey(
    createHash("sha256").update(`coin-tester-internet_computer/${path}`).digest(),
  );

/** The uncompressed 65-byte secp256k1 public key, in hex, as the device returns it. */
export const publicKeyAt = (path: string): string =>
  Buffer.from(identityAt(path).getPublicKey().toRaw()).toString("hex");

/** The default ledger account of the key's principal, in hex. */
export const addressAt = (path: string): string =>
  AccountIdentifier.fromPrincipal({ principal: identityAt(path).getPrincipal() }).toHex();

/**
 * The signature the Ledger ICP app returns for a CBOR `{ content }` request: secp256k1 (low-S,
 * r || s) over sha256("\x0Aic-request" || requestId). `Secp256k1KeyIdentity.sign` hashes its input
 * with sha256 before signing.
 */
export async function signRequest(path: string, envelope: Uint8Array): Promise<Buffer> {
  const { content } = Cbor.decode<{ content: Record<string, unknown> }>(envelope);
  const requestId = new Uint8Array(requestIdOf(content));
  const signature = await identityAt(path).sign(
    new Uint8Array([...IC_REQUEST_DOMAIN_SEPARATOR, ...requestId]),
  );
  return Buffer.from(signature);
}

const addressResponse = (path: string): ICPGetAddrResponse => ({
  returnCode: SW_OK,
  errorMessage: "",
  publicKey: Buffer.from(publicKeyAt(path), "hex"),
  address: Buffer.from(addressAt(path), "hex"),
  principalText: identityAt(path).getPrincipal().toText(),
});

/**
 * Plays the device for the legacy bridge. A neuron-creation transfer (`stake`) only changes what the
 * app displays; the signature is the same as for a send.
 */
export function buildSigner(): ICPSigner {
  return {
    getAppConfiguration: async () => ({ version: "0.0.0", testMode: false, locked: false }),
    getAddressAndPubKey: async path => addressResponse(path),
    showAddressAndPubKey: async path => addressResponse(path),
    sign: async (path, message) => ({
      returnCode: SW_OK,
      signatureRS: await signRequest(path, message),
    }),
    signUpdateCall: async (path, callRequest, readStateRequest) => ({
      returnCode: SW_OK,
      requestSignatureRS: await signRequest(path, callRequest),
      readStateSignatureRS: await signRequest(path, readStateRequest),
    }),
  };
}
