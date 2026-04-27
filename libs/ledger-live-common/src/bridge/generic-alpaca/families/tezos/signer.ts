import Tezos, { type Curve, TezosCurves } from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";
import type { AlpacaSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";

type TezosDerivationMode = GetAddressOptions["derivationMode"] | undefined;

type TezosAlpacaSigner = Tezos & {
  signTransaction(
    path: string,
    rawTxHex: string,
    options?: { derivationMode?: TezosDerivationMode },
  ): Promise<string>;
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: TezosDerivationMode },
  ): ReturnType<Tezos["getAddress"]>;
};

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

function curveForDerivationMode(derivationMode?: TezosDerivationMode): Curve {
  switch (derivationMode) {
    case undefined:
    case "":
    case "galleonL":
    case "tezbox":
    case "tezboxL":
    case "tezosbip44h":
      return TezosCurves.ED25519;
    case "tezosSecp256k1":
      return TezosCurves.SECP256K1;
    default:
      throw new Error(`Unsupported Tezos derivation mode: ${derivationMode}`);
  }
}

export const createSignerTezos: CreateSigner<TezosAlpacaSigner> = (transport: Transport) => {
  const tezos = new Tezos(transport);
  const getLedgerAddress = tezos.getAddress.bind(tezos);
  const signLedgerOperation = tezos.signOperation.bind(tezos);
  // align with genericSignOperation that calls signer.signTransaction
  return Object.assign(tezos, {
    async signTransaction(
      path: string,
      rawTxHex: string,
      options?: { derivationMode?: TezosDerivationMode },
    ) {
      const curve = curveForDerivationMode(options?.derivationMode);
      const { signature } = await signLedgerOperation(path, rawTxHex, { curve });
      return convertSecp256k1DERToRaw(signature);
    },
    async getAddress(
      path: string,
      options: { verify?: boolean; derivationMode?: TezosDerivationMode } = {},
    ) {
      const curve = curveForDerivationMode(options.derivationMode);
      const result = await getLedgerAddress(path, { verify: !!options.verify, curve });
      return {
        ...result,
        publicKey:
          normalizePublicKeyForAddress(result.publicKey, result.address) || result.publicKey,
      };
    },
  });
};

export const context = executeWithSigner(createSignerTezos);

const getAddress = (signerContext: SignerContext<TezosAlpacaSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, derivationMode }: GetAddressOptions) => {
    const result = await signerContext(deviceId, signer =>
      signer.getAddress(path, { verify, derivationMode }),
    );

    return { ...result, path };
  };
};

export default {
  context,
  getAddress: getAddress(context),
} satisfies AlpacaSigner;
