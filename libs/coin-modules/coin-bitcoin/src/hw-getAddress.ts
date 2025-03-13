import { log } from "@ledgerhq/logs";
import {
  getAddressFormatDerivationMode,
  type GetAddressOptions,
} from "@ledgerhq/coin-framework/derivation";
import { UnsupportedDerivation } from "@ledgerhq/coin-framework/errors";
import { AddressFormat, BitcoinAddress, SignerContext } from "./signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

const resolver = (signerContext: SignerContext): GetAddressFn => {
  return async (
    deviceId: string,
    { currency, path, verify, derivationMode, forceFormat }: GetAddressOptions,
  ) => {
    const format = (forceFormat as AddressFormat) || getAddressFormatDerivationMode(derivationMode);
    console.log({currency, path, verify, derivationMode, forceFormat})

    let result;
    try {
      result = (await signerContext(deviceId, currency, signer =>
        signer.getWalletPublicKey(path, {
          verify: verify || false,
          format,
        }),
      )) as BitcoinAddress;
      console.log({result})
    } catch (e: any) {
      // TODO Should normalize error returned from ledgerjs
        console.log({e})
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
    console.log({publicKey})

    log(
      "hw",
      `getAddress ${currency.id} path=${path} address=${bitcoinAddress} publicKey=${publicKey} chainCode=${chainCode}`,
    );
    return {
      address: bitcoinAddress,
      path,
      publicKey,
      chainCode,
    };
  };
};

export default resolver;
