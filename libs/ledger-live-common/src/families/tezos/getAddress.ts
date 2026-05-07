import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Curve, TezosSigner } from "./types";
import { normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";

type TezosDerivationMode = GetAddressOptions["derivationMode"] | undefined;

function curveForDerivationMode(derivationMode?: TezosDerivationMode): Curve {
  switch (derivationMode) {
    case undefined:
    case "":
    case "galleonL":
    case "tezbox":
    case "tezboxL":
    case "tezosbip44h":
      return 0;
    case "tezosSecp256k1":
      return 1;
    default:
      throw new Error(`Unsupported Tezos derivation mode: ${derivationMode}`);
  }
}

const getAddress = (signerContext: SignerContext<TezosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, derivationMode }: GetAddressOptions) => {
    const curve = curveForDerivationMode(derivationMode);
    const r = await signerContext(deviceId, async signer => {
      const { address, publicKey } = await signer.getAddress(path, { verify: !!verify, curve });
      return {
        address,
        publicKey: normalizePublicKeyForAddress(publicKey, address) || publicKey,
      };
    });
    return { ...r, path };
  };
};

export default getAddress;
