import type Transport from "@ledgerhq/hw-transport";
import BtcNew from "./BtcNew";
import BtcOld from "./BtcOld";
import type { CreateTransactionArg } from "./createTransaction";
import { getTrustedInput } from "./getTrustedInput";
import { getTrustedInputBIP143 } from "./getTrustedInputBIP143";
import type { AddressFormat } from "./getWalletPublicKey";
import { AppClient } from "./newops/appClient";
import { serializeTransactionOutputs } from "./serializeTransaction";
import type { SignP2SHTransactionArg } from "./signP2SHTransaction";
import { splitTransaction } from "./splitTransaction";
import type { Transaction } from "./types";
export type { AddressFormat };
import { signP2SHTransaction } from "./signP2SHTransaction";
import { signMessage } from "./signMessage";
import { checkIsBtcLegacy, getAppAndVersion } from "./getAppAndVersion";

/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc({ transport, currency: "bitcoin" });
 */

export default class Btc {
  private _transport: Transport;
  private _impl: BtcOld | BtcNew;

  constructor({
    transport,
    scrambleKey = "BTC",
    currency = "bitcoin",
  }: {
    transport: Transport;
    scrambleKey?: string;
    currency?: string;
  }) {
    this._transport = transport;
    this._transport.decorateAppAPIMethods(
      this,
      [
        "getWalletXpub",
        "getWalletPublicKey",
        "signP2SHTransaction",
        "signMessage",
        "createPaymentTransaction",
        "getTrustedInput",
        "getTrustedInputBIP143",
      ],
      scrambleKey
    );
    // new APDU (nano app API) for bitcoin and old APDU for altcoin
    if (currency === "bitcoin" || currency === "bitcoin_testnet") {
      this._impl = new BtcNew(new AppClient(this._transport));
    } else {
      this._impl = new BtcOld(this._transport);
    }
  }

  /**
   * Get an XPUB with a ledger device
   * @param arg derivation parameter
   * - path: a BIP 32 path of the account level. e.g. `84'/0'/0'`
   * - xpubVersion: the XPUBVersion of the coin used. (use @ledgerhq/currencies if needed)
   * @returns XPUB of the account
   */
  getWalletXpub(arg: { path: string; xpubVersion: number }): Promise<string> {
    return this.changeImplIfNecessary().then((impl) => {
      return impl.getWalletXpub(arg);
    });
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
    return this.changeImplIfNecessary().then((impl) => {
      return impl.getWalletPublicKey(path, options);
    });
  }

  /**
   * You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
   * @example
   btc.signMessage("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
     var v = result['v'] + 27 + 4;
     var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
     console.log("Signature : " + signature);
   }).catch(function(ex) {console.log(ex);});
   */
  signMessage(
    path: string,
    messageHex: string
  ): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    return signMessage(this._transport, {
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
  createPaymentTransaction(arg: CreateTransactionArg): Promise<string> {
    if (arguments.length > 1) {
      throw new Error(
        "@ledgerhq/hw-app-btc: createPaymentTransaction multi argument signature is deprecated. please switch to named parameters."
      );
    }
    return this.changeImplIfNecessary().then((impl) => {
      return impl.createPaymentTransaction(arg);
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
    return signP2SHTransaction(this._transport, arg);
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
      this._transport,
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
      this._transport,
      indexLookup,
      transaction,
      additionals
    );
  }

  async changeImplIfNecessary(): Promise<BtcOld | BtcNew> {
    // if BtcOld was instantiated, stick with it
    if (this._impl instanceof BtcOld) return this._impl;

    const appAndVersion = await getAppAndVersion(this._transport);
    let isBtcLegacy = true; // default for all altcoins

    if (
      appAndVersion.name === "Bitcoin" ||
      appAndVersion.name === "Bitcoin Test"
    ) {
      const [major, minor] = appAndVersion.version.split(".");
      // we use the legacy protocol for versions below 2.1.0 of the Bitcoin app.
      isBtcLegacy =
        parseInt(major) <= 1 || (parseInt(major) == 2 && parseInt(minor) == 0);
    } else if (
      appAndVersion.name === "Bitcoin Legacy" ||
      appAndVersion.name === "Bitcoin Test Legacy"
    ) {
      // the "Bitcoin Legacy" and "Bitcoin Testnet Legacy" app use the legacy protocol, regardless of the version
      isBtcLegacy = true;
    } else if (appAndVersion.name === "Exchange") {
      // We can't query the version of the Bitcoin app if we're coming from Exchange;
      // therefore, we use a workaround to distinguish legacy and new versions.
      // This can be removed once Ledger Live enforces minimum bitcoin version >= 2.1.0.
      isBtcLegacy = await checkIsBtcLegacy(this._transport);
    }

    if (isBtcLegacy) {
      this._impl = new BtcOld(this._transport);
    }
    return this._impl;
  }
}
