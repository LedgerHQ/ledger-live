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
import BtcOld from "@ledgerhq/hw-app-btc/lib/BtcOld";

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
    skipAppFailSafeCheck,
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

  if (!skipAppFailSafeCheck) {
    const { bitcoinLikeInfo } = currency;

    if (bitcoinLikeInfo) {
      const res = await getBitcoinLikeInfo(transport);

      if (res) {
        const { P2SH, P2PKH } = res;

        if (P2SH !== bitcoinLikeInfo.P2SH || P2PKH !== bitcoinLikeInfo.P2PKH) {
          if (
            currency.id in oldP2SH &&
            P2SH === oldP2SH[currency.id] &&
            P2PKH === bitcoinLikeInfo.P2PKH
          ) {
            log(
              "hw",
              `getAddress ${currency.id} app is outdated. P2SH=${P2SH} P2PKH=${P2PKH}`
            );
            throw new UpdateYourApp(`UpdateYourApp ${currency.id}`, currency);
          }

          log(
            "hw",
            `getAddress ${currency.id} app is wrong. P2SH=${P2SH} P2PKH=${P2PKH}`
          );
          throw new BtcUnmatchedApp(`BtcUnmatchedApp ${currency.id}`, currency);
        }
      }
    }
  }

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
