/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
import type Transport from "@ledgerhq/hw-transport";
import { Common, GetPublicKeyResult, SignTransactionResult, GetVersionResult } from "hw-app-alamgu";
import blake2b from "blake2b";

export { GetPublicKeyResult, SignTransactionResult, GetVersionResult, blake2b };

export interface TransferTxParams {
  path?: string,
  namespace?: string,
  module?: string,
  recipient: string,
  amount: string,
  chainId: number,
  network: string,
  gasPrice?: string,
  gasLimit?: string,
  creationTime?: number,
  ttl?: string, // Could be decimal
  nonce?: string,
}

export interface TransferCrossChainTxParams extends TransferTxParams {
  recipient_chainId: number,
}

export interface BuildTransactionResult {
  pubkey: string,
  pact_command: PactCommandObject,
};

export interface PactCommandObject {
  cmd: string,
  hash: string,
  sigs: PactCommandSig[],
};

export interface PactCommandSig {
  sig: string,
};


/**
 * Kadena API
 *
 * @example
 * import Kadena from "hw-app-kda";
 * const kda = new Kadena(transport)
 */

export default class Kadena extends Common {
  
  constructor(transport: Transport) {
    super(transport, "KDA");
  }

  /**
    * Sign a transaction hash with the key at a BIP32 path.
    *
    * @param hash - The transaction hash; this can be any of a node Buffer, Uint8Array, a hexadecimal string, or a base64 encoded string.
    * @param path - the path to use when signing the transaction.
    */
  async signHash(
    path: string,
    hash: string | Buffer | Uint8Array,
  ): Promise<SignTransactionResult> {
    const paths = splitPath(path);
    const cla = 0x00;
    const ins = 0x04;
    const p1 = 0;
    const p2 = 0;
    const rawHash = typeof hash == "string" ?
      (hash.length == 64 ? Buffer.from(hash, "hex") : Buffer.from(hash, "base64")) : Buffer.from(hash);
    if (rawHash.length != 32) {
      throw new TypeError("Hash is not 32 bytes");
    } else {
      // Bip32key payload same as getPublicKey
      const bip32KeyPayload = buildBip32KeyPayload(path);
      // These are just squashed together
      const payload = Buffer.concat([rawHash, bip32KeyPayload])
      const signature = await this.sendChunks(cla, ins, p1, p2, payload);
      return {
        signature,
      };
    }
  }

  /**
    * Sign a transfer transaction.
    *
    * @param params - The `TransferTxParams` parameters used to construct the transaction.
    * @returns the signed Pact Command and the public key of the signer.
    */
  async signTransferTx(
    params: TransferTxParams
  ): Promise<BuildTransactionResult> {
    var p1 = params as TransferCrossChainTxParams;
    p1.recipient_chainId = 0; // Ignored by Ledger App
    return await this.signTxInternal(p1, 0);
  }

  /**
   * Sign a transfer-create transaction.
   *
   * @param params - The `TransferTxParams` parameters used to construct the transaction.
   * @returns the signed Pact Command and the public key of the signer.
   */
  async signTransferCreateTx(
    params: TransferTxParams
  ): Promise<BuildTransactionResult> {
    var p1 = params as TransferCrossChainTxParams;
    p1.recipient_chainId = 0; // Ignored by Ledger App
    return await this.signTxInternal(p1, 1);
  }

  /**
   * Sign a cross-chain transfer transaction.
   *
   * @param params - The `TransferCrossChainTxParams` parameters used to construct the transaction.
   * @returns the signed Pact Command and the public key of the signer.
   */
  async signTransferCrossChainTx(
    params: TransferCrossChainTxParams
  ): Promise<BuildTransactionResult> {
    if (params.chainId == params.recipient_chainId)
      throw new TypeError("Recipient chainId is same as sender's in a cross-chain transfer");
    return await this.signTxInternal(params, 2);
  }

  private async signTxInternal(
    params: TransferCrossChainTxParams,
    txType
  ): Promise<BuildTransactionResult> {
    // Use defaults if value not specified
    const t: Date = new Date();

    const path = params.path === undefined? "44'/626'/0'/0/0": params.path;
    if (!(path.startsWith("44'/626'/") || path.startsWith("m/44'/626'/")))
      throw new TypeError("Path does not start with `44'/626'/` or `m/44'/626'/`");

    const recipient = params.recipient.startsWith('k:') ? params.recipient.substring(2) : params.recipient;
    if (!recipient.match(/[0-9A-Fa-f]{64}/g))
      throw new TypeError("Recipient should be a hex encoded pubkey or 'k:' address");

    const namespace_ = params.namespace === undefined? "": params.namespace;
    const module_ = params.module === undefined? "": params.module;
    if (namespace_ != "" && module_ == "") throw new TypeError("Along with 'namespace' 'module' need to be specified");

    let isNaN_ = (v) => {
      if (v === undefined) return false;
      return (isNaN(v as unknown as number));
    }
    if (isNaN_(params.amount)) throw new TypeError("amount is non a number");
    if (isNaN_(params.gasPrice)) throw new TypeError("gasPrice is non a number");
    if (isNaN_(params.gasLimit)) throw new TypeError("gasLimit is non a number");
    if (isNaN_(params.creationTime)) throw new TypeError("creationTime is non a number");
    if (isNaN_(params.ttl)) throw new TypeError("ttl is non a number");

    const amount = convertDecimal(params.amount);
    const gasPrice = params.gasPrice === undefined? "1.0e-6": params.gasPrice;
    const gasLimit = params.gasLimit === undefined? "2300" : params.gasLimit;
    const creationTime = params.creationTime === undefined? Math.floor(t.getTime() / 1000) : params.creationTime;
    const ttl = params.ttl === undefined? "600" : params.ttl;

    const nonce = params.nonce === undefined? "": params.nonce;
    // Do APDU call
    const paths = splitPath(path);
    const cla = 0x00;
    const ins = 0x10;
    const p1 = 0;
    const p2 = 0;
    const txTypeB = Buffer.alloc(1);
    txTypeB.writeInt8(txType);
    // These are just squashed together
    const payload = Buffer.concat(
      [ buildBip32KeyPayload(path)
       , txTypeB
       , textPayload(recipient)
       , textPayload(params.recipient_chainId.toString())
       , textPayload(params.network)
       , textPayload(amount)
       , textPayload(namespace_)
       , textPayload(module_)
       , textPayload(gasPrice)
       , textPayload(gasLimit)
       , textPayload(creationTime.toString())
       , textPayload(params.chainId.toString())
       , textPayload(nonce)
       , textPayload(ttl)
      ])
    const response = await this.sendChunks(cla, ins, p1, p2, payload);
    const signature = response.slice(0,64).toString("hex");
    const pubkey = response.slice(64,96).toString("hex");

    // Build the JSON, exactly like the Ledger app
    var cmd = "{\"networkId\":\"" + params.network + "\"";
    if (txType == 0) {
      cmd += ",\"payload\":{\"exec\":{\"data\":{},\"code\":\"";
      if (namespace_ == "") {
        cmd += "(coin.transfer";
      } else {
        cmd += "(" + namespace_ + "." + module_ + ".transfer";
      }
      cmd += " \\\"k:" + pubkey + "\\\"";
      cmd += " \\\"k:" + recipient + "\\\"";
      cmd += " " + amount + ")\"}}";
      cmd += ",\"signers\":[{\"pubKey\":\"" + pubkey + "\"";
      cmd += ",\"clist\":[{\"args\":[\"k:" + pubkey + "\",\"k:" + recipient + "\"," + amount + "]"
      if (namespace_ == "") {
        cmd += ",\"name\":\"coin.TRANSFER\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      } else {
        cmd += ",\"name\":\"" + namespace_ + "." + module_ + ".TRANSFER\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      }
    } else if (txType == 1) {
      cmd += ",\"payload\":{\"exec\":{\"data\":{";
      cmd += "\"ks\":{\"pred\":\"keys-all\",\"keys\":[\"" + recipient + "\"]}";
      cmd += "},\"code\":\"";
      if (namespace_ == "") {
        cmd += "(coin.transfer-create";
      } else {
        cmd += "(" + namespace_ + "." + module_ + ".transfer-create";
      }
      cmd += " \\\"k:" + pubkey + "\\\"";
      cmd += " \\\"k:" + recipient + "\\\"";
      cmd += " (read-keyset \\\"ks\\\")";
      cmd += " " + amount + ")\"}}";
      cmd += ",\"signers\":[{\"pubKey\":\"" + pubkey + "\"";
      cmd += ",\"clist\":[{\"args\":[\"k:" + pubkey + "\",\"k:" + recipient + "\"," + amount + "]"
      if (namespace_ == "") {
        cmd += ",\"name\":\"coin.TRANSFER\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      } else {
        cmd += ",\"name\":\"" + namespace_ + "." + module_ + ".TRANSFER\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      }
    } else {
      cmd += ",\"payload\":{\"exec\":{\"data\":{";
      cmd += "\"ks\":{\"pred\":\"keys-all\",\"keys\":[\"" + recipient + "\"]}";
      cmd += "},\"code\":\"";
      if (namespace_ == "") {
        cmd += "(coin.transfer-crosschain";
      } else {
        cmd += "(" + namespace_ + "." + module_ + ".transfer-crosschain";
      }
      cmd += " \\\"k:" + pubkey + "\\\"";
      cmd += " \\\"k:" + recipient + "\\\"";
      cmd += " (read-keyset \\\"ks\\\")";
      cmd += " \\\"" + params.recipient_chainId.toString() + "\\\"";
      cmd += " " + amount + ")\"}}";
      cmd += ",\"signers\":[{\"pubKey\":\"" + pubkey + "\"";
      cmd += ",\"clist\":[{\"args\":[\"k:" + pubkey + "\",\"k:" + recipient + "\"," + amount + ",\"" + params.recipient_chainId.toString() + "\"]";
      if (namespace_ == "") {
        cmd += ",\"name\":\"coin.TRANSFER_XCHAIN\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      } else {
        cmd += ",\"name\":\"" + namespace_ + "." + module_ + ".TRANSFER_XCHAIN\"},{\"args\":[],\"name\":\"coin.GAS\"}]}]";
      }
    }
    cmd += ",\"meta\":{\"creationTime\":" + creationTime.toString();
    cmd += ",\"ttl\":" + ttl + ",\"gasLimit\":" + gasLimit + ",\"chainId\":\"" + params.chainId.toString() + "\"";
    cmd += ",\"gasPrice\":" + gasPrice + ",\"sender\":\"k:" + pubkey + "\"},\"nonce\":\"" + nonce + "\"}";

    var hash_bytes = blake2b(32).update(Buffer.from(cmd, "utf-8")).digest();
    // base64url encode, remove padding
    var hash = Buffer.from(hash_bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return {
      pubkey,
      pact_command: {
        cmd,
        hash,
        sigs: [{sig: signature}],
      }
    };
  }
}

// TODO: Use splitPath and buildBip32KeyPayload from hw-app-obsidian-common
function splitPath(path: string): number[] {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach((element) => {
    let number = parseInt(element, 10);

    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }

    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }

    result.push(number);
  });
  return result;
}

function buildBip32KeyPayload(path: string): Buffer {
  const paths = splitPath(path);
  // Bip32Key payload is:
  // 1 byte with number of elements in u32 array path
  // Followed by the u32 array itself
  const payload = Buffer.alloc(1 + paths.length * 4);
  payload[0] = paths.length
  paths.forEach((element, index) => {
    payload.writeUInt32LE(element, 1 + 4 * index);
  });
  return payload
}

function textPayload(txt: string): Buffer {
  // 1 byte: length
  const payload = Buffer.alloc(1 + txt.length);
  payload[0] = txt.length
  payload.write(txt, 1, "utf-8");
  return payload
}

const convertDecimal = (decimal) => {
  decimal = decimal.toString();
  if (decimal.includes('.')) { return decimal }
  if ((decimal / Math.floor(decimal)) === 1) {
    decimal = decimal + ".0"
  }
  return decimal
}

