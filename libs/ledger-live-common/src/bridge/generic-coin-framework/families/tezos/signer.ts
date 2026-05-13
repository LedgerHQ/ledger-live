import Tezos, { TezosCurves, type Curve } from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AlpacaSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";

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

function curveForDerivationMode(derivationMode?: string): Curve {
  return derivationMode === "tezosSecp256k1" ? TezosCurves.SECP256K1 : TezosCurves.ED25519;
}

type TezosSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    rawTxHex: string,
    options?: { derivationMode?: string },
  ): Promise<string>;
};

const createSignerTezos: CreateSigner<TezosSigner> = (transport: Transport) => {
  const tezos = new Tezos(transport);
  return {
    async signTransaction(path: string, rawTxHex: string, options?: { derivationMode?: string }) {
      const curve = curveForDerivationMode(options?.derivationMode);
      const { signature } = await tezos.signOperation(path, rawTxHex, { curve });
      return convertSecp256k1DERToRaw(signature);
    },
    async getAddress(path: string, options: { verify?: boolean; derivationMode?: string } = {}) {
      const curve = curveForDerivationMode(options.derivationMode);
      const { address, publicKey: raw } = await tezos.getAddress(path, {
        verify: !!options.verify,
        curve,
      });
      return { path, address, publicKey: normalizePublicKeyForAddress(raw, address) ?? raw };
    },
  };
};

export const tezosGetAddress = (signerContext: SignerContext<TezosSigner>): GetAddressFn => {
  return async (deviceId, { path, verify, derivationMode }) => {
    return signerContext(deviceId, signer => signer.getAddress(path, { verify, derivationMode }));
  };
};

const context = executeWithSigner(createSignerTezos);
const getAddress = tezosGetAddress(context);

export default {
  context,
  getAddress,
} satisfies AlpacaSigner;
