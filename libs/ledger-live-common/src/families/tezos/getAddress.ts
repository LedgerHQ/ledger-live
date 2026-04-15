import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TezosSigner } from "./types";

const getAddress = (signerContext: SignerContext<TezosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, derivationMode }: GetAddressOptions) => {
    const curve = derivationMode === "tezosSecp256k1" ? 1 : 0;
    const r = await signerContext(deviceId, async signer => {
      const ledgerSigner = signer.createLedgerSigner(path, !!verify, curve);
      const address = await ledgerSigner.publicKeyHash();
      const publicKey = await ledgerSigner.publicKey();
      return { address, publicKey };
    });
    return { ...r, path };
  };
};

export default getAddress;
