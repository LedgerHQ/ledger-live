import { log } from "@ledgerhq/logs";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext, BitcoinAddress } from "../types/signer";

/**
 * Device getAddress resolver. Unlike coin-bitcoin's hw-getAddress.ts (which
 * dispatches through a multi-currency chain-adapter registry), coin-zcash is
 * single-currency: it always calls the DMK Zcash signer's own getAddress.
 */
const resolver = (signerContext: SignerContext): GetAddressFn => {
  return async (deviceId: string, options: GetAddressOptions) => {
    const { path, verify } = options;

    const { address, publicKey, chainCode } = await signerContext(deviceId, signer =>
      signer.getAddress(path, verify || false),
    );

    log("hw", `getAddress zcash path=${path} address=${address} publicKey=${publicKey}`);

    const result: BitcoinAddress = {
      bitcoinAddress: address,
      publicKey,
      chainCode,
    };

    return {
      address: result.bitcoinAddress,
      path,
      publicKey: result.publicKey,
      ...(result.chainCode ? { chainCode: result.chainCode } : {}),
    };
  };
};

export default resolver;
