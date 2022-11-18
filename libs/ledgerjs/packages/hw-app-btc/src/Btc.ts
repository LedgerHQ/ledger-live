import type Transport from "@ledgerhq/hw-transport";
import { pathStringToArray } from "./bip32";
import BtcNew, { canSupportApp } from "./BtcNew";
import BtcOld from "./BtcOld";
import type { CreateTransactionArg } from "./createTransaction";
import { getAppAndVersion } from "./getAppAndVersion";
import { getTrustedInput } from "./getTrustedInput";
import { getTrustedInputBIP143 } from "./getTrustedInputBIP143";
import type { AddressFormat } from "./getWalletPublicKey";
import { AppClient } from "./newops/appClient";
import { serializeTransactionOutputs } from "./serializeTransaction";
import type { SignP2SHTransactionArg } from "./signP2SHTransaction";
import { splitTransaction } from "./splitTransaction";
import type { Transaction } from "./types";
export type { AddressFormat };
/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */

export default class Btc {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "BTC") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getWalletXpub",
        "getWalletPublicKey",
        "signP2SHTransaction",
        "signMessageNew",
        "createPaymentTransactionNew",
        "getTrustedInput",
        "getTrustedInputBIP143",
      ],
      scrambleKey
    );
  }

  /**
   * Get an XPUB with a ledger device
   * @param arg derivation parameter
   * - path: a BIP 32 path of the account level. e.g. `84'/0'/0'`
   * - xpubVersion: the XPUBVersion of the coin used. (use @ledgerhq/currencies if needed)
   * @returns XPUB of the account
   */
  getWalletXpub(arg: { path: string; xpubVersion: number }): Promise<string> {
    return this.getCorrectImpl().then((impl) => impl.getWalletXpub(arg));
  }

  /**
   * @param path a BIP 32 path
   * @param options an object with optional these fields:
   *
   * - verify (boolean) will ask user to confirm the address on the device
   *
   * - format ("legacy" | "p2sh" | "bech32" | "bech32m" | "cashaddr") to use different bitcoin address formatter.
   *
   * NB The normal usage is to use:
   *
   * - legacy format with 44' paths
   *
   * - p2sh format with 49' paths
   *
   * - bech32 format with 84' paths
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
    let options;
    if (arguments.length > 2 || typeof opts === "boolean") {
      console.warn(
        "btc.getWalletPublicKey deprecated signature used. Please switch to getWalletPublicKey(path, { format, verify })"
      );
      options = {
        verify: !!opts,
        // eslint-disable-next-line prefer-rest-params
        format: arguments[2] ? "p2sh" : "legacy",
      };
    } else {
      options = opts || {};
    }
    return this.getCorrectImpl().then((impl) => {
      /**
       * Definition: A "normal path" is a prefix of a standard path where all
       * the hardened steps of the standard path are included. For example, the
       * paths m/44'/1'/17' and m/44'/1'/17'/1 are normal paths, but m/44'/1'
       * is not. m/'199/1'/17'/0/1 is not a normal path either.
       *
       * There's a compatiblity issue between old and new app: When exporting
       * the key of a non-normal path with verify=false, the new app would
       * return an error, whereas the old app would return the key.
       *
       * See
       * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md#get_extended_pubkey
       *
       * If format bech32m is used, we'll not use old, because it doesn't
       * support it.
       *
       * When to use new (given the app supports it)
       *   * format is bech32m or
       *   * path is normal or
       *   * verify is true
       *
       * Otherwise use old.
       */
      if (
        impl instanceof BtcNew &&
        options.format != "bech32m" &&
        (!options.verify || options.verify == false) &&
        !isPathNormal(path)
      ) {
        console.warn(`WARNING: Using deprecated device protocol to get the public key because
        
        * a non-standard path is requested, and
        * verify flag is false
        
        The new protocol only allows export of non-standard paths if the 
        verify flag is true. Standard paths are (currently):

        M/44'/(1|0)'/X'
        M/49'/(1|0)'/X'
        M/84'/(1|0)'/X'
        M/86'/(1|0)'/X'
        M/48'/(1|0)'/X'/Y'

        followed by "", "(0|1)", or "(0|1)/b", where a and b are 
        non-hardened. For example, the following paths are standard
        
        M/48'/1'/99'/7'
        M/86'/1'/99'/0
        M/48'/0'/99'/7'/1/17

        The following paths are non-standard

        M/48'/0'/99'           // Not deepest hardened path
        M/48'/0'/99'/7'/1/17/2 // Too many non-hardened derivation steps
        M/199'/0'/1'/0/88      // Not a known purpose 199
        M/86'/1'/99'/2         // Change path item must be 0 or 1

        This compatibility safeguard will be removed in the future.
        Please consider calling Btc.getWalletXpub() instead.`);
        return this.old().getWalletPublicKey(path, options);
      } else {
        return impl.getWalletPublicKey(path, options);
      }
    });
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
    return this.old().signMessageNew(path, messageHex);
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
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign, including leading vararg voutCount
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not. This includes wrapped segwit.
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   *
   * - "bech32" for spending native segwit outputs
   * - "bech32m" for spending segwit v1+ outputs
   * - "abc" for bch
   * - "gold" for btg
   * - "bipxxx" for using BIPxxx
   * - "sapling" to indicate a zec transaction is supporting sapling (to be set over block 419200)
   * @param expiryHeight is an optional Buffer for zec overwinter / sapling Txs
   * @param useTrustedInputForSegwit trust inputs for segwit transactions. If app version >= 1.4.0 this should be true.
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
    return this.getCorrectImpl().then((impl) => {
      return impl.createPaymentTransactionNew(arg);
    });
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
    return this.old().signP2SHTransaction(arg);
  }

  /**
   * For each UTXO included in your transaction, create a transaction object from the raw serialized version of the transaction used in this UTXO.
   * @example
  const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
   */
  splitTransaction(
    transactionHex: string,
    isSegwitSupported: boolean | null | undefined = false,
    hasTimestamp = false,
    hasExtraData = false,
    additionals: Array<string> = []
  ): Transaction {
    return splitTransaction(
      transactionHex,
      isSegwitSupported,
      hasTimestamp,
      hasExtraData,
      additionals
    );
  }

  /**
  @example
  const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
  const outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');
  */
  serializeTransactionOutputs(t: Transaction): Buffer {
    return serializeTransactionOutputs(t);
  }

  getTrustedInput(
    indexLookup: number,
    transaction: Transaction,
    additionals: Array<string> = []
  ): Promise<string> {
    return getTrustedInput(
      this.transport,
      indexLookup,
      transaction,
      additionals
    );
  }

  getTrustedInputBIP143(
    indexLookup: number,
    transaction: Transaction,
    additionals: Array<string> = []
  ): string {
    return getTrustedInputBIP143(
      this.transport,
      indexLookup,
      transaction,
      additionals
    );
  }

  // cache the underlying implementation (only once)
  private _lazyImpl: BtcOld | BtcNew | null = null;
  private async getCorrectImpl(): Promise<BtcOld | BtcNew> {
    const { _lazyImpl } = this;
    if (_lazyImpl) return _lazyImpl;
    const impl = await this.inferCorrectImpl();
    this._lazyImpl = impl;
    return impl;
  }

  private async inferCorrectImpl(): Promise<BtcOld | BtcNew> {
    const appAndVersion = await getAppAndVersion(this.transport);
    const canUseNewImplementation = canSupportApp(appAndVersion);
    if (!canUseNewImplementation) {
      return this.old();
    } else {
      return this.new();
    }
  }

  protected old(): BtcOld {
    return new BtcOld(this.transport);
  }

  protected new(): BtcNew {
    return new BtcNew(new AppClient(this.transport));
  }
}

function isPathNormal(path: string): boolean {
  //path is not deepest hardened node of a standard path or deeper, use BtcOld
  const h = 0x80000000;
  const pathElems = pathStringToArray(path);

  const hard = (n: number) => n >= h;
  const soft = (n: number | undefined) => !n || n < h;
  const change = (n: number | undefined) => !n || n == 0 || n == 1;

  if (
    pathElems.length >= 3 &&
    pathElems.length <= 5 &&
    [44 + h, 49 + h, 84 + h, 86 + h].some((v) => v == pathElems[0]) &&
    [0 + h, 1 + h].some((v) => v == pathElems[1]) &&
    hard(pathElems[2]) &&
    change(pathElems[3]) &&
    soft(pathElems[4])
  ) {
    return true;
  }
  if (
    pathElems.length >= 4 &&
    pathElems.length <= 6 &&
    48 + h == pathElems[0] &&
    [0 + h, 1 + h].some((v) => v == pathElems[1]) &&
    hard(pathElems[2]) &&
    hard(pathElems[3]) &&
    change(pathElems[4]) &&
    soft(pathElems[5])
  ) {
    return true;
  }
  return false;
}
