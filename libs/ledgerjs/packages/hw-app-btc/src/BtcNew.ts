import { crypto } from "bitcoinjs-lib";
import { pointCompress } from "tiny-secp256k1";
import {
  getXpubComponents,
  hardenedPathOf,
  pathArrayToString,
  pathStringToArray,
  pubkeyFromXpub,
} from "./bip32";
import { BufferReader } from "./buffertools";
import type { CreateTransactionArg } from "./createTransaction";
import type { AddressFormat } from "./getWalletPublicKey";
import {
  AccountType,
  p2pkh,
  p2tr,
  p2wpkh,
  p2wpkhWrapped,
  SpendingCondition,
} from "./newops/accounttype";
import { AppClient as Client } from "./newops/appClient";
import { createKey, DefaultDescriptorTemplate, WalletPolicy } from "./newops/policy";
import { extract } from "./newops/psbtExtractor";
import { finalize } from "./newops/psbtFinalizer";
import { psbtIn, PsbtV2 } from "./newops/psbtv2";
import { serializeTransaction } from "./serializeTransaction";
import type { Transaction } from "./types";

/**
 * This class implements the same interface as BtcOld (formerly
 * named Btc), but interacts with Bitcoin hardware app version 2+
 * which uses a totally new APDU protocol. This new
 * protocol is documented at
 * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md
 *
 * Since the interface must remain compatible with BtcOld, the methods
 * of this class are quite clunky, because it needs to adapt legacy
 * input data into the PSBT process. In the future, a new interface should
 * be developed that exposes PSBT to the outer world, which would render
 * a much cleaner implementation.
 */
export default class BtcNew {
  constructor(private client: Client) {}

  /**
   * This is a new method that allow users to get an xpub at a standard path.
   * Standard paths are described at
   * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md#description
   *
   * This boils down to paths (N=0 for Bitcoin, N=1 for Testnet):
   * M/44'/N'/x'/**
   * M/48'/N'/x'/y'/**
   * M/49'/N'/x'/**
   * M/84'/N'/x'/**
   * M/86'/N'/x'/**
   *
   * The method was added because of added security in the hardware app v2+. The
   * new hardware app will allow export of any xpub up to and including the
   * deepest hardened key of standard derivation paths, whereas the old app
   * would allow export of any key.
   *
   * This caused an issue for callers of this class, who only had
   * getWalletPublicKey() to call which means they have to constuct xpub
   * themselves:
   *
   * Suppose a user of this class wants to create an account xpub on a standard
   * path, M/44'/0'/Z'. The user must get the parent key fingerprint (see BIP32)
   * by requesting the parent key M/44'/0'. The new app won't allow that, because
   * it only allows exporting deepest level hardened path. So the options are to
   * allow requesting M/44'/0' from the app, or to add a new function
   * "getWalletXpub".
   *
   * We opted for adding a new function, which can greatly simplify client code.
   */
  async getWalletXpub({
    path,
    xpubVersion,
  }: {
    path: string;
    xpubVersion: number;
  }): Promise<string> {
    const pathElements: number[] = pathStringToArray(path);
    const xpub = await this.client.getExtendedPubkey(false, pathElements);
    const xpubComponents = getXpubComponents(xpub);
    if (xpubComponents.version != xpubVersion) {
      throw new Error(
        `Expected xpub version ${xpubVersion} doesn't match the xpub version from the device ${xpubComponents.version}`,
      );
    }
    return xpub;
  }

  /**
   * This method returns a public key, a bitcoin address, and and a chaincode
   * for a specific derivation path.
   *
   * Limitation: If the path is not a leaf node of a standard path, the address
   * will be the empty string "", see this.getWalletAddress() for details.
   */
  async getWalletPublicKey(
    path: string,
    opts?: {
      verify?: boolean;
      format?: AddressFormat;
    },
  ): Promise<{
    publicKey: string;
    bitcoinAddress: string;
    chainCode: string;
  }> {
    if (!isPathNormal(path)) {
      throw Error(`non-standard path: ${path}`);
    }
    const pathElements: number[] = pathStringToArray(path);
    const xpub = await this.client.getExtendedPubkey(false, pathElements);

    const display = opts?.verify ?? false;

    const address = await this.getWalletAddress(
      pathElements,
      descrTemplFrom(opts?.format ?? "legacy"),
      display,
    );
    const components = getXpubComponents(xpub);
    const uncompressedPubkey = Buffer.from(pointCompress(components.pubkey, false));
    return {
      publicKey: uncompressedPubkey.toString("hex"),
      bitcoinAddress: address,
      chainCode: components.chaincode.toString("hex"),
    };
  }

  /**
   * Get an address for the specified path.
   *
   * If display is true, we must get the address from the device, which would require
   * us to determine WalletPolicy. This requires two *extra* queries to the device, one
   * for the account xpub and one for master key fingerprint.
   *
   * If display is false we *could* generate the address ourselves, but chose to
   * get it from the device to save development time. However, it shouldn't take
   * too much time to implement local address generation.
   *
   * Moreover, if the path is not for a leaf, ie accountPath+/X/Y, there is no
   * way to get the address from the device. In this case we have to create it
   * ourselves, but we don't at this time, and instead return an empty ("") address.
   */
  private async getWalletAddress(
    pathElements: number[],
    descrTempl: DefaultDescriptorTemplate,
    display: boolean,
  ): Promise<string> {
    const accountPath = hardenedPathOf(pathElements);
    if (accountPath.length + 2 != pathElements.length) {
      return "";
    }
    const accountXpub = await this.client.getExtendedPubkey(false, accountPath);
    const masterFingerprint = await this.client.getMasterFingerprint();
    const policy = new WalletPolicy(
      descrTempl,
      createKey(masterFingerprint, accountPath, accountXpub),
    );
    const changeAndIndex = pathElements.slice(-2, pathElements.length);
    return this.client.getWalletAddress(
      policy,
      Buffer.alloc(32, 0),
      changeAndIndex[0],
      changeAndIndex[1],
      display,
    );
  }

  /**
   * Build and sign a transaction. See Btc.createPaymentTransaction for
   * details on how to use this method.
   *
   * This method will convert the legacy arguments, CreateTransactionArg, into
   * a psbt which is finally signed and finalized, and the extracted fully signed
   * transaction is returned.
   */
  async createPaymentTransaction(arg: CreateTransactionArg): Promise<string> {
    const inputCount = arg.inputs.length;
    if (inputCount == 0) {
      throw Error("No inputs");
    }
    const psbt = new PsbtV2();
    // The master fingerprint is needed when adding BIP32 derivation paths on
    // the psbt.
    const masterFp = await this.client.getMasterFingerprint();

    const accountType = accountTypeFromArg(arg, psbt, masterFp);

    if (arg.lockTime != undefined) {
      // The signer will assume locktime 0 if unset
      psbt.setGlobalFallbackLocktime(arg.lockTime);
    }
    psbt.setGlobalInputCount(inputCount);
    psbt.setGlobalPsbtVersion(2);
    psbt.setGlobalTxVersion(2);

    let notifyCount = 0;
    const progress = () => {
      if (!arg.onDeviceStreaming) return;
      arg.onDeviceStreaming({
        total: 2 * inputCount,
        index: notifyCount,
        progress: ++notifyCount / (2 * inputCount),
      });
    };

    let accountXpub = "";
    let accountPath: number[] = [];
    for (let i = 0; i < inputCount; i++) {
      progress();
      const pathElems: number[] = pathStringToArray(arg.associatedKeysets[i]);
      if (accountXpub == "") {
        // We assume all inputs belong to the same account so we set
        // the account xpub and path based on the first input.
        accountPath = pathElems.slice(0, -2);
        accountXpub = await this.client.getExtendedPubkey(false, accountPath);
      }
      await this.setInput(
        psbt,
        i,
        arg.inputs[i],
        pathElems,
        accountType,
        masterFp,
        arg.sigHashType,
      );
    }

    const outputsConcat = Buffer.from(arg.outputScriptHex, "hex");
    const outputsBufferReader = new BufferReader(outputsConcat);
    const outputCount = outputsBufferReader.readVarInt();
    psbt.setGlobalOutputCount(outputCount);
    const changeData = await this.outputScriptAt(accountPath, accountType, arg.changePath);
    // If the caller supplied a changePath, we must make sure there actually is
    // a change output. If no change output found, we'll throw an error.
    let changeFound = !changeData;
    for (let i = 0; i < outputCount; i++) {
      const amount = Number(outputsBufferReader.readUInt64());
      const outputScript = outputsBufferReader.readVarSlice();
      psbt.setOutputAmount(i, amount);
      psbt.setOutputScript(i, outputScript);

      // We won't know if we're paying to ourselves, because there's no
      // information in arg to support multiple "change paths". One exception is
      // if there are multiple outputs to the change address.
      const isChange = changeData && outputScript.equals(changeData?.cond.scriptPubKey);
      if (isChange) {
        changeFound = true;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const changePath = pathStringToArray(arg.changePath!);
        const pubkey = changeData.pubkey;

        accountType.setOwnOutput(i, changeData.cond, [pubkey], [changePath]);
      }
    }
    if (!changeFound) {
      throw new Error(
        "Change script not found among outputs! " + changeData?.cond.scriptPubKey.toString("hex"),
      );
    }

    const key = createKey(masterFp, accountPath, accountXpub);
    const p = new WalletPolicy(accountType.getDescriptorTemplate(), key);
    // This is cheating, because it's not actually requested on the
    // device yet, but it will be, soonish.
    if (arg.onDeviceSignatureRequested) arg.onDeviceSignatureRequested();

    let firstSigned = false;
    // This callback will be called once for each signature yielded.
    const progressCallback = () => {
      if (!firstSigned) {
        firstSigned = true;
        arg.onDeviceSignatureGranted && arg.onDeviceSignatureGranted();
      }
      progress();
    };

    await this.signPsbt(psbt, p, progressCallback);
    finalize(psbt);
    const serializedTx = extract(psbt);
    return serializedTx.toString("hex");
  }

  /**
   * Signs an arbitrary hex-formatted message with the private key at
   * the provided derivation path according to the Bitcoin Signature format
   * and returns v, r, s.
   */
  async signMessage({ path, messageHex }: { path: string; messageHex: string }): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    const pathElements: number[] = pathStringToArray(path);
    const message = Buffer.from(messageHex, "hex");
    const sig = await this.client.signMessage(message, pathElements);
    const buf = Buffer.from(sig, "base64");

    const v = buf.readUInt8() - 27 - 4;
    const r = buf.slice(1, 33).toString("hex");
    const s = buf.slice(33, 65).toString("hex");

    return {
      v,
      r,
      s,
    };
  }

  /**
   * Calculates an output script along with public key and possible redeemScript
   * from a path and accountType. The accountPath must be a prefix of path.
   *
   * @returns an object with output script (property "script"), redeemScript (if
   * wrapped p2wpkh), and pubkey at provided path. The values of these three
   * properties depend on the accountType used.
   */
  private async outputScriptAt(
    accountPath: number[],
    accountType: AccountType,
    path: string | undefined,
  ): Promise<{ cond: SpendingCondition; pubkey: Buffer } | undefined> {
    if (!path) return undefined;
    const pathElems = pathStringToArray(path);
    // Make sure path is in our account, otherwise something fishy is probably
    // going on.
    for (let i = 0; i < accountPath.length; i++) {
      if (accountPath[i] != pathElems[i]) {
        throw new Error(`Path ${path} not in account ${pathArrayToString(accountPath)}`);
      }
    }
    const xpub = await this.client.getExtendedPubkey(false, pathElems);
    const pubkey = pubkeyFromXpub(xpub);
    const cond = accountType.spendingCondition([pubkey]);
    return { cond, pubkey };
  }

  /**
   * Adds relevant data about an input to the psbt. This includes sequence,
   * previous txid, output index, spent UTXO, redeem script for wrapped p2wpkh,
   * public key and its derivation path.
   */
  private async setInput(
    psbt: PsbtV2,
    i: number,
    input: [Transaction, number, string | null | undefined, number | null | undefined],
    pathElements: number[],
    accountType: AccountType,
    masterFP: Buffer,
    sigHashType?: number,
  ): Promise<void> {
    const inputTx = input[0];
    const spentOutputIndex = input[1];
    // redeemScript will be null for wrapped p2wpkh, we need to create it
    // ourselves. But if set, it should be used.
    const redeemScript = input[2] ? Buffer.from(input[2], "hex") : undefined;
    const sequence = input[3];
    if (sequence != undefined) {
      psbt.setInputSequence(i, sequence);
    }
    if (sigHashType != undefined) {
      psbt.setInputSighashType(i, sigHashType);
    }
    const inputTxBuffer = serializeTransaction(inputTx, true);
    const inputTxid = crypto.hash256(inputTxBuffer);
    const xpubBase58 = await this.client.getExtendedPubkey(false, pathElements);

    const pubkey = pubkeyFromXpub(xpubBase58);
    if (!inputTx.outputs) throw Error("Missing outputs array in transaction to sign");
    const spentTxOutput = inputTx.outputs[spentOutputIndex];
    const spendCondition: SpendingCondition = {
      scriptPubKey: spentTxOutput.script,
      redeemScript: redeemScript,
    };
    const spentOutput = { cond: spendCondition, amount: spentTxOutput.amount };
    accountType.setInput(i, inputTxBuffer, spentOutput, [pubkey], [pathElements]);

    psbt.setInputPreviousTxId(i, inputTxid);
    psbt.setInputOutputIndex(i, spentOutputIndex);
  }

  /**
   * This implements the "Signer" role of the BIP370 transaction signing
   * process.
   *
   * It ssks the hardware device to sign the a psbt using the specified wallet
   * policy. This method assumes BIP32 derived keys are used for all inputs, see
   * comment in-line. The signatures returned from the hardware device is added
   * to the appropriate input fields of the PSBT.
   */
  private async signPsbt(
    psbt: PsbtV2,
    walletPolicy: WalletPolicy,
    progressCallback: () => void,
  ): Promise<void> {
    const sigs: Map<number, Buffer> = await this.client.signPsbt(
      psbt,
      walletPolicy,
      Buffer.alloc(32, 0),
      progressCallback,
    );
    sigs.forEach((v, k) => {
      // Note: Looking at BIP32 derivation does not work in the generic case,
      // since some inputs might not have a BIP32-derived pubkey.
      const pubkeys = psbt.getInputKeyDatas(k, psbtIn.BIP32_DERIVATION);
      let pubkey;
      if (pubkeys.length != 1) {
        // No legacy BIP32_DERIVATION, assume we're using taproot.
        pubkey = psbt.getInputKeyDatas(k, psbtIn.TAP_BIP32_DERIVATION);
        if (pubkey.length == 0) {
          throw Error(`Missing pubkey derivation for input ${k}`);
        }
        psbt.setInputTapKeySig(k, v);
      } else {
        pubkey = pubkeys[0];
        psbt.setInputPartialSig(k, pubkey, v);
      }
    });
  }
}

function descrTemplFrom(addressFormat: AddressFormat): DefaultDescriptorTemplate {
  if (addressFormat == "legacy") return "pkh(@0)";
  if (addressFormat == "p2sh") return "sh(wpkh(@0))";
  if (addressFormat == "bech32") return "wpkh(@0)";
  if (addressFormat == "bech32m") return "tr(@0)";
  throw new Error("Unsupported address format " + addressFormat);
}

function accountTypeFromArg(
  arg: CreateTransactionArg,
  psbt: PsbtV2,
  masterFp: Buffer,
): AccountType {
  if (arg.additionals.includes("bech32m")) return new p2tr(psbt, masterFp);
  if (arg.additionals.includes("bech32")) return new p2wpkh(psbt, masterFp);
  if (arg.segwit) return new p2wpkhWrapped(psbt, masterFp);
  return new p2pkh(psbt, masterFp);
}

/*
  The new protocol only allows standard path.
  Standard paths are (currently):
  M/44'/(1|0|88)'/X'
  M/49'/(1|0|88)'/X'
  M/84'/(1|0|88)'/X'
  M/86'/(1|0|88)'/X'
  M/48'/(1|0|88)'/X'/Y'
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

  Useful resource on derivation paths: https://learnmeabitcoin.com/technical/derivation-paths
*/

//path is not deepest hardened node of a standard path or deeper, use BtcOld
const H = 0x80000000; //HARDENED from bip32

const VALID_COIN_TYPES = [
  0, // Bitcoin
  1, // Bitcoin (Testnet)
  88, // Qtum
];

const VALID_SINGLE_SIG_PURPOSES = [
  44, // BIP44 - https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
  49, // BIP49 - https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
  84, // BIP84 - https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
  86, // BIP86 - https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki
];

const VALID_MULTISIG_PURPOSES = [
  48, // BIP48 - https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki
];

const hard = (n: number) => n >= H;
const soft = (n: number | undefined) => n === undefined || n < H;
const change = (n: number | undefined) => n === undefined || n === 0 || n === 1;

const validCoinPathPartsSet = new Set(VALID_COIN_TYPES.map(t => t + H));
const validSingleSigPurposePathPartsSet = new Set(VALID_SINGLE_SIG_PURPOSES.map(t => t + H));
const validMultiSigPurposePathPartsSet = new Set(VALID_MULTISIG_PURPOSES.map(t => t + H));

export function isPathNormal(path: string): boolean {
  const pathElems = pathStringToArray(path);

  // Single sig
  if (
    pathElems.length >= 3 &&
    pathElems.length <= 5 &&
    validSingleSigPurposePathPartsSet.has(pathElems[0]) &&
    validCoinPathPartsSet.has(pathElems[1]) &&
    hard(pathElems[2]) &&
    change(pathElems[3]) &&
    soft(pathElems[4])
  ) {
    return true;
  }

  // Multi sig
  if (
    pathElems.length >= 4 &&
    pathElems.length <= 6 &&
    validMultiSigPurposePathPartsSet.has(pathElems[0]) &&
    validCoinPathPartsSet.has(pathElems[1]) &&
    hard(pathElems[2]) &&
    hard(pathElems[3]) &&
    change(pathElems[4]) &&
    soft(pathElems[5])
  ) {
    return true;
  }
  return false;
}
