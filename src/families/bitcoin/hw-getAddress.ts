import invariant from "invariant";
import Btc, { AddressFormat } from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { BtcUnmatchedApp, UpdateYourApp } from "@ledgerhq/errors";
import getBitcoinLikeInfo from "../../hw/getBitcoinLikeInfo";
import { getAddressFormatDerivationMode } from "../../derivation";
import type { Resolver } from "../../hw/getAddress/types";
const oldP2SH = {
  digibyte: 5,
};

const resolver: Resolver = async (
  transport,
  { currency, path, verify, derivationMode, forceFormat, skipAppFailSafeCheck }
) => {
  const btc = new Btc(transport);
  const format = forceFormat || getAddressFormatDerivationMode(derivationMode);
  invariant(
    format === "legacy" ||
      format === "p2sh" ||
      format === "bech32" ||
      format === "cashaddr",
    "unsupported format %s",
    format
  );
  const { bitcoinAddress, publicKey, chainCode } = await btc.getWalletPublicKey(
    path,
    {
      verify,
      format: format as AddressFormat,
    }
  );

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

export default resolver;
