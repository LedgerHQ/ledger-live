import Btc, { AddressFormat } from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { BtcUnmatchedApp, UpdateYourApp } from "@ledgerhq/errors";
import getBitcoinLikeInfo from "../../hw/getBitcoinLikeInfo";
import { getAddressFormatDerivationMode } from "../../derivation";
import type {
  Resolver,
  GetAddressOptions,
  Result,
} from "../../hw/getAddress/types";
import { UnsupportedDerivation } from "../../errors";
import Transport from "@ledgerhq/hw-transport";
import BtcOld from "@ledgerhq/hw-app-btc/BtcOld";

const oldP2SH = {
  digibyte: 5,
};

export const getAddressWithBtcInstance = async (
  transport: Transport,
  btc: Btc | BtcOld,
  {
    currency,
    path,
    verify,
    derivationMode,
    forceFormat,
  }: GetAddressOptions
): Promise<Result> => {
  const format = forceFormat || getAddressFormatDerivationMode(derivationMode);
  let result;
  try {
    result = await btc.getWalletPublicKey(path, {
      verify,
      format: format as AddressFormat,
    });
  } catch (e: any) {
    // TODO Should normalize error returned from ledgerjs
    if (
      e &&
      e.message &&
      (e.message.includes("invalid format") ||
        e.message.includes("Unsupported address format"))
    ) {
      throw new UnsupportedDerivation();
    }
    throw e;
  }

  const { bitcoinAddress, publicKey, chainCode } = result;

  log(
    "hw",
    `getAddress ${currency.id} path=${path} address=${bitcoinAddress} publicKey=${publicKey} chainCode=${chainCode}`
  );
  return {
    address: bitcoinAddress,
    path,
    publicKey,
    chainCode,
  };
};

const resolver: Resolver = (transport, opts) =>
  getAddressWithBtcInstance(transport, new Btc(transport), opts);

export default resolver;
