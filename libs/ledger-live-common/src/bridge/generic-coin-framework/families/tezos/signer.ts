import Tezos from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import type { AlpacaSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";
import resolver from "../../../../families/tezos/getAddress";

/**
 * Converts a DER-encoded secp256k1 ECDSA signature (returned by the Tezos Ledger app)
 * to the raw 64-byte r||s format expected by the Tezos protocol.
 * Format: 0x30/0x31 <totalLen> 0x02 <rLen> <r_bytes> 0x02 <sLen> <s_bytes>
 */
export function convertSecp256k1DERToRaw(derHex: string): string {
  const buf = Buffer.from(derHex, "hex");
  if (buf.length === 64) return derHex; // already raw 64-byte format
  const rLen = buf[3];
  const rStart = 4;
  const sLenIdx = rStart + rLen + 1;
  const sLen = buf[sLenIdx];
  const sStart = sLenIdx + 1;
  return Buffer.concat([
    normalizeTo32Bytes(buf.slice(rStart, rStart + rLen)),
    normalizeTo32Bytes(buf.slice(sStart, sStart + sLen)),
  ]).toString("hex");
}

export function normalizeTo32Bytes(bytes: Buffer): Buffer {
  if (bytes.length === 33 && bytes[0] === 0x00) return bytes.slice(1);
  if (bytes.length < 32) {
    const padded = Buffer.alloc(32, 0);
    bytes.copy(padded, 32 - bytes.length);
    return padded;
  }
  return bytes;
}

function curveForDerivationMode(derivationMode?: string): DerivationType {
  return derivationMode === "tezosSecp256k1" ? DerivationType.SECP256K1 : DerivationType.ED25519;
}

const createSignerTezos: CreateSigner<
  Tezos & {
    createLedgerSigner: (
      path: string,
      prompt: boolean,
      derivationType: number,
    ) => TaquitoLedgerSigner;
  }
> = (transport: Transport) => {
  const tezos = new Tezos(transport);
  // align with genericSignOperation that calls signer.signTransaction
  return Object.assign(tezos, {
    async signTransaction(path: string, rawTxHex: string, options?: { derivationMode?: string }) {
      const curve = curveForDerivationMode(options?.derivationMode);
      const { signature } = await tezos.signOperation(path, rawTxHex, { curve });
      return convertSecp256k1DERToRaw(signature);
    },
    async getAddress(path: string, options: { verify?: boolean; derivationMode?: string } = {}) {
      const curve = curveForDerivationMode(options.derivationMode);
      const ledgerSigner = new TaquitoLedgerSigner(transport, path, !!options.verify, curve);
      const address = await ledgerSigner.publicKeyHash();
      const publicKey = await ledgerSigner.publicKey();
      return { path, address, publicKey };
    },
    createLedgerSigner(path: string, prompt: boolean, derivationType: number) {
      // Map 0 -> ED25519, 1 -> SECP256K1, 2 -> P256 by convention
      let dt: DerivationType = DerivationType.ED25519;
      if (derivationType === 1) dt = DerivationType.SECP256K1;
      else if (derivationType === 2) dt = DerivationType.P256;
      return new TaquitoLedgerSigner(transport, path, prompt, dt);
    },
  });
};

export const context = executeWithSigner(createSignerTezos);

export default {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
