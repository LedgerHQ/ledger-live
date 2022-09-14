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
// FIXME drop:
import type Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { decodeTxInfo, hexBuffer, maybeHexBuffer, splitPath } from "./utils";
// NB: these are temporary import for the deprecated fallback mechanism
import { LedgerEthTransactionResolution, LoadConfig } from "./services/types";
import ledgerService from "./services/ledger";
import {
  EthAppNftNotSupported,
  EthAppPleaseEnableContractData,
} from "./errors";
import {
  signEIP712HashedMessage,
  signEIP712Message,
  EIP712Message,
  isEIP712Message,
} from "./modules/EIP712";

export { ledgerService, isEIP712Message };

export type StarkQuantizationType =
  | "eth"
  | "erc20"
  | "erc721"
  | "erc20mintable"
  | "erc721mintable";
const starkQuantizationTypeMap = {
  eth: 1,
  erc20: 2,
  erc721: 3,
  erc20mintable: 4,
  erc721mintable: 5,
};

const remapTransactionRelatedErrors = (e) => {
  if (e && e.statusCode === 0x6a80) {
    return new EthAppPleaseEnableContractData(
      "Please enable Blind signing or Contract data in the Ethereum app Settings"
    );
  }

  return e;
};

/**
 * Ethereum API
 *
 * @example
 * import Eth from "@ledgerhq/hw-app-eth";
 * const eth = new Eth(transport)
 */

export default class Eth {
  transport: Transport;
  loadConfig: LoadConfig;

  setLoadConfig(loadConfig: LoadConfig): void {
    this.loadConfig = loadConfig;
  }

  constructor(
    transport: Transport,
    scrambleKey = "w0w",
    loadConfig: LoadConfig = {}
  ) {
    this.transport = transport;
    this.loadConfig = loadConfig;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "provideERC20TokenInformation",
        "signTransaction",
        "signPersonalMessage",
        "getAppConfiguration",
        "signEIP712Message",
        "signEIP712HashedMessage",
        "starkGetPublicKey",
        "starkSignOrder",
        "starkSignOrder_v2",
        "starkSignTransfer",
        "starkSignTransfer_v2",
        "starkProvideQuantum",
        "starkProvideQuantum_v2",
        "starkUnsafeSign",
        "eth2GetPublicKey",
        "eth2SetWithdrawalIndex",
        "setExternalPlugin",
        "setPlugin",
        "getEIP1024PublicEncryptionKey",
        "getEIP1024SharedSecret",
      ],
      scrambleKey
    );
  }

  /**
   * get Ethereum address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(
        0xe0,
        0x02,
        boolDisplay ? 0x01 : 0x00,
        boolChaincode ? 0x01 : 0x00,
        buffer
      )
      .then((response) => {
        const publicKeyLength = response[0];
        const addressLength = response[1 + publicKeyLength];

        return {
          publicKey: response.slice(1, 1 + publicKeyLength).toString("hex"),
          address:
            "0x" +
            response
              .slice(
                1 + publicKeyLength + 1,
                1 + publicKeyLength + 1 + addressLength
              )
              .toString("ascii"),
          chainCode: boolChaincode
            ? response
                .slice(
                  1 + publicKeyLength + 1 + addressLength,
                  1 + publicKeyLength + 1 + addressLength + 32
                )
                .toString("hex")
            : undefined,
        };
      });
  }

  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign.
   *
   * @param path: the BIP32 path to sign the transaction on
   * @param rawTxHex: the raw ethereum transaction in hexadecimal to sign
   * @param resolution: resolution is an object with all "resolved" metadata necessary to allow the device to clear sign information. This includes: ERC20 token information, plugins, contracts, NFT signatures,... You must explicitly provide something to avoid having a warning. By default, you can use Ledger's service or your own resolution service. See services/types.js for the contract. Setting the value to "null" will fallback everything to blind signing but will still allow the device to sign the transaction.
   * @example
   import { ledgerService } from "@ledgerhq/hw-app-eth"
   const tx = "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"; // raw tx to sign
   const resolution = await ledgerService.resolveTransaction(tx);
   const result = eth.signTransaction("44'/60'/0'/0/0", tx, resolution);
   console.log(result);
   */
  async signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    if (resolution === undefined) {
      console.warn(
        "hw-app-eth: signTransaction(path, rawTxHex, resolution): " +
          "please provide the 'resolution' parameter. " +
          "See https://github.com/LedgerHQ/ledgerjs/blob/master/packages/hw-app-eth/README.md " +
          "– the previous signature is deprecated and providing the 3rd 'resolution' parameter explicitly will become mandatory so you have the control on the resolution and the fallback mecanism (e.g. fallback to blind signing or not)." +
          "// Possible solution:\n" +
          " + import { ledgerService } from '@ledgerhq/hw-app-eth';\n" +
          " + const resolution = await ledgerService.resolveTransaction(rawTxHex);"
      );
      resolution = await ledgerService
        .resolveTransaction(rawTxHex, this.loadConfig, {
          externalPlugins: true,
          erc20: true,
        })
        .catch((e) => {
          console.warn(
            "an error occurred in resolveTransaction => fallback to blind signing: " +
              String(e)
          );
          return null;
        });
    }

    // provide to the device resolved information to make it clear sign the signature
    if (resolution) {
      for (const plugin of resolution.plugin) {
        await setPlugin(this.transport, plugin);
      }
      for (const { payload, signature } of resolution.externalPlugin) {
        await setExternalPlugin(this.transport, payload, signature);
      }
      for (const nft of resolution.nfts) {
        await provideNFTInformation(this.transport, Buffer.from(nft, "hex"));
      }
      for (const data of resolution.erc20Tokens) {
        await provideERC20TokenInformation(
          this.transport,
          Buffer.from(data, "hex")
        );
      }
    }

    const rawTx = Buffer.from(rawTxHex, "hex");
    const { vrsOffset, txType, chainId, chainIdTruncated } =
      decodeTxInfo(rawTx);

    const paths = splitPath(path);
    let response;
    let offset = 0;
    while (offset !== rawTx.length) {
      const first = offset === 0;
      const maxChunkSize = first ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;

      if (vrsOffset != 0 && offset + chunkSize >= vrsOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize = rawTx.length - offset;
      }

      const buffer = Buffer.alloc(
        first ? 1 + paths.length * 4 + chunkSize : chunkSize
      );

      if (first) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }

      response = await this.transport
        .send(0xe0, 0x04, first ? 0x00 : 0x80, 0x00, buffer)
        .catch((e) => {
          throw remapTransactionRelatedErrors(e);
        });

      offset += chunkSize;
    }

    const response_byte: number = response[0];
    let v = "";

    if (chainId.times(2).plus(35).plus(1).isGreaterThan(255)) {
      const oneByteChainId = (chainIdTruncated * 2 + 35) % 256;

      const ecc_parity = Math.abs(response_byte - oneByteChainId);

      if (txType != null) {
        // For EIP2930 and EIP1559 tx, v is simply the parity.
        v = ecc_parity % 2 == 1 ? "00" : "01";
      } else {
        // Legacy type transaction with a big chain ID
        v = chainId.times(2).plus(35).plus(ecc_parity).toString(16);
      }
    } else {
      v = response_byte.toString(16);
    }

    // Make sure v has is prefixed with a 0 if its length is odd ("1" -> "01").
    if (v.length % 2 == 1) {
      v = "0" + v;
    }

    const r = response.slice(1, 1 + 32).toString("hex");
    const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
    return { v, r, s };
  }

  /**
   */
  getAppConfiguration(): Promise<{
    arbitraryDataEnabled: number;
    erc20ProvisioningNecessary: number;
    starkEnabled: number;
    starkv2Supported: number;
    version: string;
  }> {
    return this.transport.send(0xe0, 0x06, 0x00, 0x00).then((response) => {
      return {
        arbitraryDataEnabled: response[0] & 0x01,
        erc20ProvisioningNecessary: response[0] & 0x02,
        starkEnabled: response[0] & 0x04,
        starkv2Supported: response[0] & 0x08,
        version: "" + response[1] + "." + response[2] + "." + response[3],
      };
    });
  }

  /**
  * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
  * @example
  eth.signPersonalMessage("44'/60'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */
  async signPersonalMessage(
    path: string,
    messageHex: string
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }> {
    const paths = splitPath(path);
    let offset = 0;
    const message = Buffer.from(messageHex, "hex");
    let response;

    while (offset !== message.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      const chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize
      );

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
        message.copy(
          buffer,
          1 + 4 * paths.length + 4,
          offset,
          offset + chunkSize
        );
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }

      response = await this.transport.send(
        0xe0,
        0x08,
        offset === 0 ? 0x00 : 0x80,
        0x00,
        buffer
      );

      offset += chunkSize;
    }

    const v = response[0];
    const r = response.slice(1, 1 + 32).toString("hex");
    const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
    return { v, r, s };
  }

  /**
  * Sign a prepared message following web3.eth.signTypedData specification. The host computes the domain separator and hashStruct(message)
  * @example
  eth.signEIP712HashedMessage("44'/60'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */
  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }> {
    return signEIP712HashedMessage(
      this.transport,
      path,
      domainSeparatorHex,
      hashStructMessageHex
    );
  }

  /**
   * Sign an EIP-721 formatted message following the specification here:
   * https://github.com/LedgerHQ/app-ethereum/blob/develop/doc/ethapp.asc#sign-eth-eip-712
   @example
   eth.signEIP721Message("44'/60'/0'/0/0", {
      domain: {
        chainId: 69,
        name: "Da Domain",
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        version: "1"
      },
      types: {
        "EIP712Domain": [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" }
          ],
        "Test": [
          { name: "contents", type: "string" }
        ]
      },
      primaryType: "Test",
      message: {contents: "Hello, Bob!"},
    })
   *
   * @param {String} path derivationPath
   * @param {Object} jsonMessage message to sign
   * @param {Boolean} fullImplem use the legacy implementation
   * @returns {Promise}
   */
  async signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem = false
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }> {
    return signEIP712Message(this.transport, path, jsonMessage, fullImplem);
  }

  /**
   * get Stark public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return the Stark public key
   */
  starkGetPublicKey(path: string, boolDisplay?: boolean): Promise<Buffer> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xf0, 0x02, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then((response) => {
        return response.slice(0, response.length - 2);
      });
  }

  /**
   * sign a Stark order
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantization quantization used for the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantization quantization used for the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignOrder(
    path: string,
    sourceTokenAddress: string | undefined,
    sourceQuantization: BigNumber,
    destinationTokenAddress: string | undefined,
    destinationQuantization: BigNumber,
    sourceVault: number,
    destinationVault: number,
    amountSell: BigNumber,
    amountBuy: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 + paths.length * 4 + 20 + 32 + 20 + 32 + 4 + 4 + 8 + 8 + 4 + 4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(sourceQuantization.toString(16).padStart(64, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 32;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(
      destinationQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x01, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark order using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantizationType quantization type used for the source token
   * @option sourceQuantization quantization used for the source token (not present for erc 721 or mintable erc 721)
   * @option sourceMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantizationType quantization type used for the destination token
   * @option destinationQuantization quantization used for the destination token (not present for erc 721 or mintable erc 721)
   * @option destinationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignOrder_v2(
    path: string,
    sourceTokenAddress: string | undefined,
    sourceQuantizationType: StarkQuantizationType,
    sourceQuantization: BigNumber | undefined,
    sourceMintableBlobOrTokenId: BigNumber | undefined,
    destinationTokenAddress: string | undefined,
    destinationQuantizationType: StarkQuantizationType,
    destinationQuantization: BigNumber | undefined,
    destinationMintableBlobOrTokenId: BigNumber | undefined,
    sourceVault: number,
    destinationVault: number,
    amountSell: BigNumber,
    amountBuy: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);

    if (!(sourceQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignOrderv2 invalid source quantization type=" +
          sourceQuantizationType
      );
    }

    if (!(destinationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignOrderv2 invalid destination quantization type=" +
          destinationQuantizationType
      );
    }

    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 +
        paths.length * 4 +
        1 +
        20 +
        32 +
        32 +
        1 +
        20 +
        32 +
        32 +
        4 +
        4 +
        8 +
        8 +
        4 +
        4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[sourceQuantizationType];
    offset++;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (sourceQuantization) {
      Buffer.from(
        sourceQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (sourceMintableBlobOrTokenId) {
      Buffer.from(
        sourceMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    buffer[offset] = starkQuantizationTypeMap[destinationQuantizationType];
    offset++;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (destinationQuantization) {
      Buffer.from(
        destinationQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (destinationMintableBlobOrTokenId) {
      Buffer.from(
        destinationMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x03, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark transfer
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantization quantization used for the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignTransfer(
    path: string,
    transferTokenAddress: string | undefined,
    transferQuantization: BigNumber,
    targetPublicKey: string,
    sourceVault: number,
    destinationVault: number,
    amountTransfer: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 + paths.length * 4 + 20 + 32 + 32 + 4 + 4 + 8 + 4 + 4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(
      transferQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, offset);
    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x02, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark transfer or conditional transfer using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantizationType quantization type used for the token to be transferred
   * @option transferQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option transferMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @option conditionalTransferAddress onchain address of the condition for a conditional transfer
   * @option conditionalTransferFact fact associated to the condition for a conditional transfer
   * @return the signature
   */
  starkSignTransfer_v2(
    path: string,
    transferTokenAddress: string | undefined,
    transferQuantizationType: StarkQuantizationType,
    transferQuantization: BigNumber | undefined,
    transferMintableBlobOrTokenId: BigNumber | undefined,
    targetPublicKey: string,
    sourceVault: number,
    destinationVault: number,
    amountTransfer: BigNumber,
    nonce: number,
    timestamp: number,
    conditionalTransferAddress?: string,
    conditionalTransferFact?: BigNumber
  ): Promise<Buffer | { r: string; s: string }> {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    const conditionalTransferAddressHex = maybeHexBuffer(
      conditionalTransferAddress
    );

    if (!(transferQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignTransferv2 invalid quantization type=" +
          transferQuantizationType
      );
    }

    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 +
        paths.length * 4 +
        1 +
        20 +
        32 +
        32 +
        32 +
        4 +
        4 +
        8 +
        4 +
        4 +
        (conditionalTransferAddressHex ? 32 + 20 : 0),
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[transferQuantizationType];
    offset++;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (transferQuantization) {
      Buffer.from(
        transferQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (transferMintableBlobOrTokenId) {
      Buffer.from(
        transferMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);

    if (conditionalTransferAddressHex && conditionalTransferFact) {
      offset += 4;
      Buffer.from(
        conditionalTransferFact.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
      offset += 32;
      conditionalTransferAddressHex.copy(buffer, offset);
    }

    return this.transport
      .send(
        0xf0,
        0x04,
        conditionalTransferAddressHex ? 0x05 : 0x04,
        0x00,
        buffer
      )
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantization quantization used for the token to be transferred
   */
  starkProvideQuantum(
    operationContract: string | undefined,
    operationQuantization: BigNumber
  ): Promise<boolean> {
    const operationContractHex = maybeHexBuffer(operationContract);
    const buffer = Buffer.alloc(20 + 32, 0);

    if (operationContractHex) {
      operationContractHex.copy(buffer, 0);
    }

    Buffer.from(
      operationQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, 20);
    return this.transport.send(0xf0, 0x08, 0x00, 0x00, buffer).then(
      () => true,
      (e) => {
        if (e && e.statusCode === 0x6d00) {
          // this case happen for ETH application versions not supporting Stark extensions
          return false;
        }

        throw e;
      }
    );
  }

  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call using the Starkex V2 protocol
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantizationType quantization type of the token to be transferred
   * @option operationQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option operationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) of the token to be transferred
   */
  starkProvideQuantum_v2(
    operationContract: string | undefined,
    operationQuantizationType: StarkQuantizationType,
    operationQuantization?: BigNumber,
    operationMintableBlobOrTokenId?: BigNumber
  ): Promise<boolean> {
    const operationContractHex = maybeHexBuffer(operationContract);

    if (!(operationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkProvideQuantumV2 invalid quantization type=" +
          operationQuantizationType
      );
    }

    const buffer = Buffer.alloc(20 + 32 + 32, 0);
    let offset = 0;

    if (operationContractHex) {
      operationContractHex.copy(buffer, offset);
    }

    offset += 20;

    if (operationQuantization) {
      Buffer.from(
        operationQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (operationMintableBlobOrTokenId) {
      Buffer.from(
        operationMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    return this.transport
      .send(
        0xf0,
        0x08,
        starkQuantizationTypeMap[operationQuantizationType],
        0x00,
        buffer
      )
      .then(
        () => true,
        (e) => {
          if (e && e.statusCode === 0x6d00) {
            // this case happen for ETH application versions not supporting Stark extensions
            return false;
          }

          throw e;
        }
      );
  }

  /**
   * sign the given hash over the Stark curve
   * It is intended for speed of execution in case an unknown Stark model is pushed and should be avoided as much as possible.
   * @param path a path in BIP 32 format
   * @param hash hexadecimal hash to sign
   * @return the signature
   */
  starkUnsafeSign(
    path: string,
    hash: string
  ): Promise<Buffer | { r: string; s: string }> {
    const hashHex = hexBuffer(hash);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4 + 32);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    hashHex.copy(buffer, offset);
    return this.transport
      .send(0xf0, 0x0a, 0x00, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * get an Ethereum 2 BLS-12 381 public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey
   * @example
   * eth.eth2GetPublicKey("12381/3600/0/0").then(o => o.publicKey)
   */
  eth2GetPublicKey(
    path: string,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xe0, 0x0e, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then((response) => {
        return {
          publicKey: response.slice(0, -2).toString("hex"),
        };
      });
  }

  /**
   * Set the index of a Withdrawal key used as withdrawal credentials in an ETH 2 deposit contract call signature
   *
   * It shall be run before the ETH 2 deposit transaction is signed. If not called, the index is set to 0
   *
   * @param withdrawalIndex index path in the EIP 2334 path m/12381/3600/withdrawalIndex/0
   * @return True if the method was executed successfully
   */
  eth2SetWithdrawalIndex(withdrawalIndex: number): Promise<boolean> {
    const buffer = Buffer.alloc(4, 0);
    buffer.writeUInt32BE(withdrawalIndex, 0);
    return this.transport.send(0xe0, 0x10, 0x00, 0x00, buffer).then(
      () => true,
      (e) => {
        if (e && e.statusCode === 0x6d00) {
          // this case happen for ETH application versions not supporting ETH 2
          return false;
        }

        throw e;
      }
    );
  }

  /**
   * get a public encryption key on Curve25519 according to EIP 1024
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey
   * @example
   * eth.getEIP1024PublicEncryptionKey("44'/60'/0'/0/0").then(o => o.publicKey)
   */
  getEIP1024PublicEncryptionKey(
    path: string,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xe0, 0x18, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then((response) => {
        return {
          publicKey: response.slice(0, -2).toString("hex"),
        };
      });
  }

  /**
   * get a shared secret on Curve25519 according to EIP 1024
   * @param path a path in BIP 32 format
   * @param remotePublicKeyHex remote Curve25519 public key
   * @option boolDisplay optionally enable or not the display
   * @return an object with a shared secret
   * @example
   * eth.getEIP1024SharedSecret("44'/60'/0'/0/0", "87020e80af6e07a6e4697f091eacadb9e7e6629cb7e5a8a371689a3ed53b3d64").then(o => o.sharedSecret)
   */
  getEIP1024SharedSecret(
    path: string,
    remotePublicKeyHex: string,
    boolDisplay?: boolean
  ): Promise<{
    sharedSecret: string;
  }> {
    const paths = splitPath(path);
    const remotePublicKey = hexBuffer(remotePublicKeyHex);
    const buffer = Buffer.alloc(1 + paths.length * 4 + 32);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    remotePublicKey.copy(buffer, offset);
    return this.transport
      .send(0xe0, 0x18, boolDisplay ? 0x01 : 0x00, 0x01, buffer)
      .then((response) => {
        return {
          sharedSecret: response.slice(0, -2).toString("hex"),
        };
      });
  }

  provideERC20TokenInformation({ data }: { data: Buffer }): Promise<boolean> {
    return provideERC20TokenInformation(this.transport, data);
  }

  setExternalPlugin(
    pluginName: string,
    contractAddress: string,
    selector: string
  ): Promise<boolean> {
    console.warn(
      "hw-app-eth: eth.setExternalPlugin is deprecated. signTransaction solves this for you when providing it in `resolution`."
    );
    return setExternalPlugin(this.transport, pluginName, selector);
  }

  setPlugin(data: string): Promise<boolean> {
    console.warn(
      "hw-app-eth: eth.setPlugin is deprecated. signTransaction solves this for you when providing it in `resolution`."
    );
    return setPlugin(this.transport, data);
  }
}

// internal helpers

function provideERC20TokenInformation(
  transport: Transport,
  data: Buffer
): Promise<boolean> {
  return transport.send(0xe0, 0x0a, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app, since older app version had the ERC20 data hardcoded, it's fine to assume it worked.
        // we return a flag to know if the call was effective or not
        return false;
      }
      throw e;
    }
  );
}

function provideNFTInformation(
  transport: Transport,
  data: Buffer
): Promise<boolean> {
  return transport.send(0xe0, 0x14, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6d00) {
        // older version of ETH app => error because we don't allow blind sign when NFT is explicitly requested to be resolved.
        throw new EthAppNftNotSupported();
      }
      throw e;
    }
  );
}

function setExternalPlugin(
  transport: Transport,
  payload: string,
  signature: string
): Promise<boolean> {
  const payloadBuffer = Buffer.from(payload, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  const buffer = Buffer.concat([payloadBuffer, signatureBuffer]);
  return transport.send(0xe0, 0x12, 0x00, 0x00, buffer).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6a80) {
        // this case happen when the plugin name is too short or too long
        return false;
      } else if (e && e.statusCode === 0x6984) {
        // this case happen when the plugin requested is not installed on the device
        return false;
      } else if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app
        return false;
      }
      throw e;
    }
  );
}

function setPlugin(transport: Transport, data: string): Promise<boolean> {
  const buffer = Buffer.from(data, "hex");
  return transport.send(0xe0, 0x16, 0x00, 0x00, buffer).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6a80) {
        // this case happen when the plugin name is too short or too long
        return false;
      } else if (e && e.statusCode === 0x6984) {
        // this case happen when the plugin requested is not installed on the device
        return false;
      } else if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app
        return false;
      }
      throw e;
    }
  );
}
