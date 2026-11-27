import { accountFromMnemonic, sign } from "iso-filecoin/wallet";
import { lotusCid } from "iso-filecoin/utils";
import type {
  FilecoinGetAddrResponse,
  FilecoinSignature,
  FilecoinSigner,
} from "@ledgerhq/coin-filecoin/types";

/** The generic-adapter signer: it receives what the coin module's `craftTransaction` produced. */
export type GenericFilecoinSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (path: string, unsigned: string) => Promise<string>;
};

/** A bridge passes the path with or without the leading `m/`. */
function normalizePath(path: string): string {
  return path.startsWith("m/") ? path : `m/${path}`;
}

export function deriveAccount(mnemonic: string, path: string) {
  return accountFromMnemonic(mnemonic, "SECP256K1", normalizePath(path), undefined, "mainnet");
}

/** ASN.1 DER integer: minimal big-endian bytes, with a leading zero when the high bit is set. */
function derInteger(bytes: Uint8Array): number[] {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const body = Array.from(bytes.subarray(start));
  if (body[0] & 0x80) body.unshift(0);
  return [0x02, body.length, ...body];
}

function toDer(compact: Uint8Array): Uint8Array {
  const r = derInteger(compact.subarray(0, 32));
  const s = derInteger(compact.subarray(32, 64));
  return Uint8Array.from([0x30, r.length + s.length, ...r, ...s]);
}

/**
 * Signs the way the device does: the blake2b-256 digest of the message CID, as the 65 bytes
 * `r || s || recovery id`.
 */
export function signMessageBytes(mnemonic: string, path: string, cbor: Uint8Array): Uint8Array {
  const { privateKey } = deriveAccount(mnemonic, path);
  return sign(privateKey, "SECP256K1", lotusCid(cbor)).data;
}

async function addressAndPubKey(mnemonic: string, path: string): Promise<FilecoinGetAddrResponse> {
  const account = deriveAccount(mnemonic, path);
  return {
    addrString: account.address.toString(),
    addrByte: account.address.toBytes(),
    compressed_pk: account.publicKey,
  };
}

/** The legacy bridge's signer, a software stand-in for the Filecoin app. */
export function buildFilecoinSigner(mnemonic: string): FilecoinSigner {
  return {
    getAddressAndPubKey: path => addressAndPubKey(mnemonic, path),
    showAddressAndPubKey: path => addressAndPubKey(mnemonic, path),
    sign: async (path, message): Promise<FilecoinSignature> => {
      const signature = signMessageBytes(mnemonic, path, message);
      return { signature_compact: signature, signature_der: toDer(signature) };
    },
  };
}

export function buildGenericFilecoinSigner(mnemonic: string): GenericFilecoinSigner {
  return {
    async getAddress(path) {
      const account = deriveAccount(mnemonic, path);
      return {
        address: account.address.toString(),
        publicKey: Buffer.from(account.publicKey).toString("hex"),
      };
    },
    async signTransaction(path, unsigned) {
      const { cbor } = JSON.parse(unsigned) as { cbor?: string };
      if (cbor === undefined) throw new Error("the crafted transaction has no cbor");

      return Buffer.from(signMessageBytes(mnemonic, path, Buffer.from(cbor, "base64"))).toString(
        "base64",
      );
    },
  };
}
