import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import eip55 from "eip55";
import { CeloSigner } from ".";
import { getCoinConfig } from "../config";

/*
NOTE: we should use the evm resolver for celo, but due to the signer types conflicting for now 
we are using a separate resolver
*/
const resolver = (signerContext: SignerContext<CeloSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer => {
      const chainId = getCoinConfig(currency.id).info.chainId.toString();
      return signer.getAddress(path, verify, false, chainId);
    });

    return {
      address: eip55.encode(address),
      publicKey,
      path,
    };
  };
};

export default resolver;
