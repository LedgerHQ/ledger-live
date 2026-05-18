import { log } from "@ledgerhq/logs";
import {
  getAddressFormatDerivationMode,
  type GetAddressOptions,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { UnsupportedDerivation } from "@ledgerhq/ledger-wallet-framework/errors";
import { AddressFormat, BitcoinAddress, SignerContext } from "./signer";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getChainAdapter } from "./chain-adapters/registry";

const resolver = (signerContext: SignerContext): GetAddressFn => {
  return async (deviceId: string, options: GetAddressOptions) => {
    const { currency, path, verify, derivationMode, forceFormat } = options;
    const format = (forceFormat as AddressFormat) || getAddressFormatDerivationMode(derivationMode);
    const adapter = getChainAdapter(currency.id);

    let result: BitcoinAddress | undefined;
    try {
      result = await adapter.getAddress?.(deviceId, options, signerContext);
      if (!result) {
        result = await signerContext(deviceId, currency, signer =>
          signer.getWalletPublicKey(path, {
            verify: verify || false,
            format,
          }),
        );
      }
    } catch (e: any) {
      // TODO Should normalize error returned from ledgerjs
      if (
        e &&
        e.message &&
        (e.message.includes("invalid format") || e.message.includes("Unsupported address format"))
      ) {
        throw new UnsupportedDerivation();
      }
      throw e;
    }

    const { bitcoinAddress, publicKey, chainCode } = result;

    log(
      "hw",
      `getAddress ${currency.id} path=${path} address=${bitcoinAddress} publicKey=${publicKey} chainCode=${chainCode}`,
    );
    return {
      address: bitcoinAddress,
      path,
      publicKey,
      ...(chainCode ? { chainCode } : {}),
    };
  };
};

export default resolver;
