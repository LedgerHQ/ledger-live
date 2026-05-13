import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";
import type { TezosSigner, Curve } from "@ledgerhq/coin-tezos/types/index";

const getAddress = (signerContext: SignerContext<TezosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, derivationMode }: GetAddressOptions) => {
    const curve: Curve = derivationMode === "tezosSecp256k1" ? 0x01 : 0x00;
    const r = await signerContext(deviceId, async signer => {
      const { address, publicKey: raw } = await signer.getAddress(path, {
        verify: !!verify,
        curve,
      });
      return { address, publicKey: normalizePublicKeyForAddress(raw, address) ?? raw };
    });
    return { ...r, path };
  };
};

export default getAddress;
