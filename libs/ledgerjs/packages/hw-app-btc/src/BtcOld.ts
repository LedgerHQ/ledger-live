import bs58 from "bs58";
import RIPEMD160 from "ripemd160";
import sha from "sha.js";
import type Transport from "@ledgerhq/hw-transport";
import type { CreateTransactionArg } from "./createTransaction";
import { createTransaction } from "./createTransaction";
import type { AddressFormat } from "./getWalletPublicKey";
import { getWalletPublicKey } from "./getWalletPublicKey";
import { signMessage } from "./signMessage";
import type { SignP2SHTransactionArg } from "./signP2SHTransaction";
import { signP2SHTransaction } from "./signP2SHTransaction";
import { pathArrayToString, pathStringToArray } from "./bip32";
export type { AddressFormat };

/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */

export default class BtcOld {
  constructor(private transport: Transport) {}

  private derivationsCache = {};
  private async derivatePath(path: string) {
    if (this.derivationsCache[path]) return this.derivationsCache[path];
    const res = await getWalletPublicKey(this.transport, {
      path,
    });
    this.derivationsCache[path] = res;
    return res;
  }

  async getWalletXpub({
    path,
    xpubVersion,
  }: {
    path: string;
    xpubVersion: number;
  }): Promise<string> {
    const pathElements = pathStringToArray(path);
    const parentPath = pathElements.slice(0, -1);
    const parentDerivation = await this.derivatePath(
      pathArrayToString(parentPath)
    );
    const accountDerivation = await this.derivatePath(path);
    const fingerprint = makeFingerprint(
      compressPublicKeySECP256(Buffer.from(parentDerivation.publicKey, "hex"))
    );
    const xpub = makeXpub(
      xpubVersion,
      pathElements.length,
      fingerprint,
      pathElements[pathElements.length - 1],
      Buffer.from(accountDerivation.chainCode, "hex"),
      compressPublicKeySECP256(Buffer.from(accountDerivation.publicKey, "hex"))
    );
    return xpub;
  }

  /**
   * @param path a BIP 32 path
   * @param options an object with optional these fields:
   *
   * - verify (boolean) will ask user to confirm the address on the device
   *
   * - format ("legacy" | "p2sh" | "bech32" | "cashaddr") to use different bitcoin address formatter.
   *
   * NB The normal usage is to use:
   *
   * - legacy format with 44' paths
   *
   * - p2sh format with 49' paths
   *
   * - bech32 format with 173' paths
   *
   * - cashaddr in case of Bitcoin Cash
   *
   * @example
   * btc.getWalletPublicKey("44'/0'/0'/0/0").then(o => o.bitcoinAddress)
   * btc.getWalletPublicKey("49'/0'/0'/0/0", { format: "p2sh" }).then(o => o.bitcoinAddress)
   */
  getWalletPublicKey(
    path: string,
    opts?: {
      verify?: boolean;
      format?: AddressFormat;
    }
  ): Promise<{
    publicKey: string;
    bitcoinAddress: string;
    chainCode: string;
  }> {
    if (opts?.format === "bech32m") {
      throw new Error("Unsupported address format bech32m");
    }
    return getWalletPublicKey(this.transport, { ...opts, path });
  }

  /**
   * You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
   * @example
   btc.signMessageNew_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
     var v = result['v'] + 27 + 4;
     var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
     console.log("Signature : " + signature);
   }).catch(function(ex) {console.log(ex);});
   */
  signMessageNew(
    path: string,
    messageHex: string
  ): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    return signMessage(this.transport, {
      path,
      messageHex,
    });
  }

  /**
   * To sign a transaction involving standard (P2PKH) inputs, call createTransaction with the following parameters
   * @param inputs is an array of [ transaction, output_index, optional redeem script, optional sequence ] where
   *
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the optional redeem script to use when consuming a Segregated Witness input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param changePath is an optional BIP 32 path pointing to the path to the public key used to compute the change address
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   *
   * - "bech32" for spending native segwit outputs
   * - "abc" for bch
   * - "gold" for btg
   * - "bipxxx" for using BIPxxx
   * - "sapling" to indicate a zec transaction is supporting sapling (to be set over block 419200)
   * @param expiryHeight is an optional Buffer for zec overwinter / sapling Txs
   * @param useTrustedInputForSegwit trust inputs for segwit transactions
   * @return the signed transaction ready to be broadcast
   * @example
  btc.createTransaction({
   inputs: [ [tx1, 1] ],
   associatedKeysets: ["0'/0/0"],
   outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
  }).then(res => ...);
   */
  createPaymentTransactionNew(arg: CreateTransactionArg): Promise<string> {
    if (arguments.length > 1) {
      console.warn(
        "@ledgerhq/hw-app-btc: createPaymentTransactionNew multi argument signature is deprecated. please switch to named parameters."
      );
    }
    return createTransaction(this.transport, arg);
  }

  /**
   * To obtain the signature of multisignature (P2SH) inputs, call signP2SHTransaction_async with the folowing parameters
   * @param inputs is an array of [ transaction, output_index, redeem script, optional sequence ] where
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the mandatory redeem script associated to the current P2SH input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @return the signed transaction ready to be broadcast
   * @example
  btc.signP2SHTransaction({
  inputs: [ [tx, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ],
  associatedKeysets: ["0'/0/0"],
  outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
  }).then(result => ...);
   */
  signP2SHTransaction(arg: SignP2SHTransactionArg): Promise<string[]> {
    if (arguments.length > 1) {
      console.warn(
        "@ledgerhq/hw-app-btc: signP2SHTransaction multi argument signature is deprecated. please switch to named parameters."
      );
    }

    return signP2SHTransaction(this.transport, arg);
  }
}

function makeFingerprint(compressedPubKey) {
  return hash160(compressedPubKey).slice(0, 4);
}

function asBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(n, 0);
  return buf;
}

const compressPublicKeySECP256 = (publicKey: Buffer) =>
  Buffer.concat([
    Buffer.from([0x02 + (publicKey[64] & 0x01)]),
    publicKey.slice(1, 33),
  ]);

function makeXpub(
  version: number,
  depth: number,
  parentFingerprint: Buffer,
  index: number,
  chainCode: Buffer,
  pubKey: Buffer
) {
  const indexBuffer = asBufferUInt32BE(index);
  indexBuffer[0] |= 0x80;
  const extendedKeyBytes = Buffer.concat([
    asBufferUInt32BE(version),
    Buffer.from([depth]),
    parentFingerprint,
    indexBuffer,
    chainCode,
    pubKey,
  ]);
  const checksum = hash256(extendedKeyBytes).slice(0, 4);
  return bs58.encode(Buffer.concat([extendedKeyBytes, checksum]));
}

function sha256(buffer: Buffer | string) {
  return sha("sha256").update(buffer).digest();
}
function hash256(buffer: Buffer | string) {
  return sha256(sha256(buffer));
}
function ripemd160(buffer: Buffer | string) {
  return new RIPEMD160().update(buffer).digest();
}
function hash160(buffer: Buffer | string) {
  return ripemd160(sha256(buffer));
}
