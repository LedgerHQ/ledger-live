// from https://github.com/LedgerHQ/xpub-scan/blob/master/src/actions/deriveAddresses.ts

import * as bech32 from "bech32";
import { bech32m } from "../../bech32m";
import * as bjs from "bitcoinjs-lib";
import { getSecp256k1Instance } from "./secp256k1";
import { InvalidAddress } from "@ledgerhq/errors";
import { DerivationModes } from "../types";
import Base from "./base";

/**
 * Temporarily copied fromBech32 and toBech32 from bitcoinjs-lib master branch (as of 2021-09-02,
 * commit 7b753caad6a5bf13d40ffb6ae28c2b00f7f5f585) so that we can make use of the
 * updated bech32 lib version 2.0.0 that supports bech32m. bitcoinjs-lib version 5.2.0
 * as currently used by wallet-btc uses an older version of bech32 that lacks bech32m support.
 *
 * When a new version of bitcoinjs-lib that supports bech32m is released this function can
 * be removed and calls should be directed to bitcoinjs-lib instead. Our direct dependency
 * on bech32 lib should also be removed.
 *
 * TODO: Replace with bitcoinjs-lib call
 */
/* eslint-disable */
function fromBech32(address: string): {
  version: number;
  prefix: string;
  data: Buffer;
} {
  let result;
  let version;
  try {
    result = bech32.decode(address);
  } catch (e) {}

  if (result) {
    version = result.words[0];
    if (version !== 0) throw new TypeError(address + " uses wrong encoding");
  } else {
    result = bech32m.decode(address);
    version = result.words[0];
    if (version === 0) throw new TypeError(address + " uses wrong encoding");
  }

  const data = bech32.fromWords(result.words.slice(1));

  return {
    version,
    prefix: result.prefix,
    data: Buffer.from(data),
  };
}

function toBech32(data: Buffer, version: number, prefix: string): string {
  const words = bech32.toWords(data);
  words.unshift(version);

  return version === 0
    ? bech32.encode(prefix, words)
    : bech32m.encode(prefix, words);
}
/* eslint-enable */

// This function expects a valid base58check address or a valid
// bech32/bech32m address.
function toOutputScriptTemporary(
  validAddress: string,
  network: bjs.Network
): Buffer {
  try {
    const decodeBase58 = bjs.address.fromBase58Check(validAddress);
    if (decodeBase58.version === network.pubKeyHash)
      return bjs.payments.p2pkh({ hash: decodeBase58.hash }).output as Buffer;
    if (decodeBase58.version === network.scriptHash)
      return bjs.payments.p2sh({ hash: decodeBase58.hash }).output as Buffer;
  } catch (e) {
    // It's not a base58 address, so it's a segwit address
  }
  const decodeBech32 = fromBech32(validAddress);
  return bjs.script.compile([
    // OP_0 is encoded as 0x00, but OP_1 through OP_16 are encoded as 0x51 though 0x60, see BIP173
    decodeBech32.version + (decodeBech32.version > 0 ? 0x50 : 0),
    decodeBech32.data,
  ]);
}

class Bitcoin extends Base {
  toOutputScript(address: string): Buffer {
    // Make sure the address is valid on this network
    // otherwise we can't call toOutputScriptTemporary.
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    // bitcoinjs-lib/src/address doesn't yet have released support for bech32m,
    // so we'll implement our own version of toOutputScript while waiting.
    // This implementation is highly inspired (stolen) from bitcoinjs-lib's
    // master branch.
    // One major difference is that our function requires an already
    // valid address, whereas to bitcoinjs-lib version doesn't.
    // TODO: Replace with bitcoinjs-lib call
    return toOutputScriptTemporary(address, this.network);
  }

  validateAddress(address: string): boolean {
    try {
      // This prefix check is to avoid returning false in cases where a valid base58 address also happens
      // to be a valid bech32(m) string (but invalid segwit address).
      if (address.toLowerCase().startsWith(`${this.network.bech32}1`)) {
        return this.tryBech32(address);
      }
    } catch {
      /* Try base58 instead */
    }
    try {
      return this.tryBase58(address);
    } catch {
      return false;
    }
  }

  // get address given an address type
  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    switch (derivationMode) {
      case DerivationModes.TAPROOT:
        return await this.getTaprootAddress(xpub, account, index);
      default:
        return super.customGetAddress(derivationMode, xpub, account, index);
    }
  }

  private tryBech32(address: string): boolean {
    const result = fromBech32(address);
    if (this.network.bech32 !== result.prefix) {
      // Address doesn't use the expected human-readable part ${network.bech32}
      return false;
    }
    if (result.version > 16 || result.version < 0) {
      // Address has invalid version
      return false;
    }
    if (result.data.length < 2 || result.data.length > 40) {
      // Address has invalid data length
      return false;
    }
    if (
      result.version === 0 &&
      result.data.length !== 20 &&
      result.data.length !== 32
    ) {
      // Version 0 address uses an invalid witness program length
      return false;
    }
    return true;
  }

  private tryBase58(address: string): boolean {
    const result = bjs.address.fromBase58Check(address);
    if (
      this.network.pubKeyHash === result.version ||
      this.network.scriptHash === result.version
    ) {
      return true;
    }
    return false;
  }

  private hashTapTweak(x: Buffer): Buffer {
    // hash_tag(x) = SHA256(SHA256(tag) || SHA256(tag) || x), see BIP340
    // See https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#specification
    const h = bjs.crypto.sha256(Buffer.from("TapTweak", "utf-8"));
    return bjs.crypto.sha256(Buffer.concat([h, h, x]));
  }

  private async getTaprootAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    const ecdsaPubkey = await this.getPubkeyAt(xpub, account, index);
    // A BIP32 derived key can be converted to a schnorr pubkey by dropping
    // the first byte, which represent the oddness/evenness. In schnorr all
    // pubkeys are even.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion
    const schnorrInternalPubkey = ecdsaPubkey.slice(1);

    const evenEcdsaPubkey = Buffer.concat([
      Buffer.from([0x02]),
      schnorrInternalPubkey,
    ]);
    const tweak = this.hashTapTweak(schnorrInternalPubkey);

    // Q = P + int(hash_TapTweak(bytes(P)))G
    const outputEcdsaKey = Buffer.from(
      await getSecp256k1Instance().publicKeyTweakAdd(evenEcdsaPubkey, tweak)
    );
    // Convert to schnorr.
    const outputSchnorrKey = outputEcdsaKey.slice(1);
    // Create address
    return toBech32(outputSchnorrKey, 1, this.network.bech32);
  }

  isTaprootAddress(address: string): boolean {
    // This prefix check is to avoid returning false in cases where a valid base58 address also happens
    // to be a valid bech32(m) string (but invalid segwit address).
    if (address.toLowerCase().startsWith(`${this.network.bech32}1`)) {
      try {
        bjs.address.fromBech32(address);
      } catch {
        return true;
      }
    }
    return false;
  }
}

export default Bitcoin;
