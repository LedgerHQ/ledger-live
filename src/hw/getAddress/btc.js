// @flow

import invariant from "invariant";
import Btc from "@ledgerhq/hw-app-btc";
import { BtcUnmatchedApp, UpdateYourApp } from "@ledgerhq/errors";
import getBitcoinLikeInfo from "../getBitcoinLikeInfo";
import { getAddressFormatDerivationMode } from "../../derivation";
import type { Resolver } from "./types";
import { log } from "../../logs";

const oldP2SH = {
  digibyte: 5
};

const resolver: Resolver = async (
  transport,
  { currency, path, verify, derivationMode, skipAppFailSafeCheck }
) => {
  const btc = new Btc(transport);
  const format = getAddressFormatDerivationMode(derivationMode);
  invariant(
    format === "legacy" || format === "p2sh" || format === "bech32",
    "unsupported format %s",
    format
  );

  const { bitcoinAddress, publicKey, chainCode } = await btc.getWalletPublicKey(
    path,
    {
      verify,
      format
    }
  );

  if (!skipAppFailSafeCheck) {
    const { bitcoinLikeInfo } = currency;
    if (bitcoinLikeInfo) {
      const { P2SH, P2PKH } = await getBitcoinLikeInfo(transport);
      if (P2SH !== bitcoinLikeInfo.P2SH || P2PKH !== bitcoinLikeInfo.P2PKH) {
        if (
          currency.id in oldP2SH &&
          P2SH === oldP2SH[currency.id] &&
          P2PKH === bitcoinLikeInfo.P2PKH
        ) {
          log(
            "hw",
            `getAddress ${
              currency.id
            } app is outdated. P2SH=${P2SH} P2PKH=${P2PKH}`
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

  log(
    "hw",
    `getAddress ${
      currency.id
    } path=${path} address=${bitcoinAddress} publicKey=${publicKey} chainCode=${chainCode}`
  );
  return { address: bitcoinAddress, path, publicKey, chainCode };
};

export default resolver;
