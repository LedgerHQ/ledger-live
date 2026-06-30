import Tezos, { TezosCurves, type Curve } from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { convertSecp256k1DERToRaw, normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";

// Re-exported from coin-tezos (single source of truth) so existing importers keep working.
export { convertSecp256k1DERToRaw, normalizeTo32Bytes } from "@ledgerhq/coin-tezos/utils";

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
} satisfies CoinFrameworkSigner;
