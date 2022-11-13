/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type Transport from "@ledgerhq/hw-transport";
import {
  scriptToAddress,
  pubkeyToAddress,
  addressToScript,
  serializeDepType,
  serializeHashType,
} from "@nervosnetwork/ckb-sdk-utils";
import BIPPath from "bip32-path";
import { UserRefusedAddress } from "@ledgerhq/errors";
import { AnnotatedTransaction, RawTransaction } from "./types";
import { SerializeAnnotatedTransaction } from "./serialization";

const CLA = 0x80;
const INS = {
  VERSION: 0x00,
  GET_WALLET_ID: 0x01,
  PROMPT_PUBLIC_KEY: 0x02,
  SIGN: 0x03,
  PROMPT_EXT_PUBLIC_KEY: 0x04,
  ACCOUNT_IMPORT: 0x05,
  SIGN_MESSAGE: 0x06,
  SIGN_MESSAGE_HASH: 0x07,
  GIT: 0x09,
  SIGN_WITH_HASH: 0x0f,
};

const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;

/**
 * Nervos App API
 */
export default class Nervos {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAppConfiguration",
        "getAddress",
        "signTransaction",
        "getExtendedPublicKey",
      ],
      "CKB"
    );
  }

  /**
   * get the version of the Nervos app installed on the hardware device
   *
   * @return an object with a version
   * @example
   * const result = await myCoin.getAppConfiguration();
   *
   * {
   *   "version": "1.0.0"
   * }
   */
  async getAppConfiguration() {
    const response = await this.transport.send(CLA, INS.VERSION, 0x00, 0x00);
    const version = "" + response[0] + "." + response[1] + "." + response[2];
    return { version };
  }

  /**
   * Serialize a bip path to data buffer
   */
  serializePath(path: Array<number>) {
    const data = Buffer.alloc(1 + path.length * 4);

    data.writeInt8(path.length, 0);
    path.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4);
    });

    return data;
  }

  compressPublicKey(publicKeyBytes: Buffer) {
    if (publicKeyBytes.length < 65) {
      return `0x${publicKeyBytes.toString("hex")}`;
    } else {
      const compressedPublicKey = Buffer.alloc(33);
      compressedPublicKey.fill(
        publicKeyBytes[64] & 1 ? "03" : "02",
        0,
        1,
        "hex"
      );
      compressedPublicKey.fill(publicKeyBytes.subarray(1, 33), 1, 33);
      return `0x${compressedPublicKey.toString("hex")}`;
    }
  }

  /**
   * Get Nervos address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey, address
   * @example
   * const result = await myCoin.getAddress("44'/309'/0'/0/0");
   * const { publicKey, lockArgs, address, returnCode } = result;
   */
  async getAddress(path: string) {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    const p1 = 0x00;
    const p2 = 0x00;
    const statusList = [SW_OK, SW_CANCEL];

    const response = await this.transport.send(
      CLA,
      INS.PROMPT_PUBLIC_KEY,
      p1,
      p2,
      serializedPath,
      statusList
    );

    const errorCodeData = response.slice(-2);
    const returnCode = errorCodeData[0] * 0x100 + errorCodeData[1];

    if (returnCode === SW_CANCEL) {
      throw new UserRefusedAddress();
    }

    const publicKeyLength = response[0];
    const publicKeyBytes = response.slice(1, 1 + publicKeyLength);
    const publicKey = this.compressPublicKey(publicKeyBytes);
    const lock = addressToScript(pubkeyToAddress(publicKey));
    const address = scriptToAddress(lock);

    return {
      publicKey,
      lockArgs: lock.args,
      address,
      returnCode,
    };
  }

  /**
   * get extended public key for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey
   * @example
   * const result = await ckb.getExtendedPublicKey("44'/309'/0'");
   * const publicKey = result;
   */
  async getExtendedPublicKey(path: string) {
    const bipPath = BIPPath.fromString(path).toPathArray();

    const p1 = 0x00;
    const p2 = 0x00;
    const data = Buffer.alloc(1 + bipPath.length * 4);

    data.writeUInt8(bipPath.length, 0);
    bipPath.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4);
    });

    const response = await this.transport.send(
      CLA,
      INS.PROMPT_EXT_PUBLIC_KEY,
      p1,
      p2,
      data
    );
    const publicKeyLength = response[0];
    const publicKeyBytes = response.slice(1, 1 + publicKeyLength);
    const publicKey = this.compressPublicKey(publicKeyBytes);
    const chainCodeOffset = 2 + publicKeyLength;
    const chainCodeLength = response[1 + publicKeyLength];
    const chainCodeBytes = response.slice(
      chainCodeOffset,
      chainCodeOffset + chainCodeLength
    );
    const chainCode = `0x${chainCodeBytes.toString("hex")}`;
    return {
      publicKey,
      chainCode,
    };
  }

  /**
   * Sign a Nervos transaction with a given BIP 32 path
   *
   * @param signPath the path to sign with, in BIP 32 format
   * @param changePath the path the transaction sends change to, in BIP 32 format (optional, defaults to signPath)
   * @param rawTxHex transaction to sign
   * @param contextTransaction list of transaction contexts for parsing
   * @param groupWitnessesHex hex of in-group and extra witnesses to include in signature
   * @return a signature as hex string
   * @example
   * TODO
   */
  async signTransaction(
    signPath: string,
    changePath: string,
    rawTx: CKBComponents.RawTransaction,
    rawContextsTx: CKBComponents.RawTransaction[],
    groupWitnessesHex?: string[]
  ): Promise<string> {
    return await this.signAnnotatedTransaction(
      this.buildAnnotatedTransaction(
        signPath,
        changePath,
        this.sdkRawTxToDeviceRawTx(rawTx),
        rawContextsTx.map((tx) => this.sdkRawTxToDeviceRawTx(tx)),
        groupWitnessesHex
      )
    );
  }

  sdkRawTxToDeviceRawTx(tx: CKBComponents.RawTransaction): RawTransaction {
    return {
      version: parseInt(tx.version),
      cellDeps: tx.cellDeps.map((cellDep) => ({
        outPoint: {
          txHash: cellDep.outPoint!.txHash,
          index: parseInt(cellDep.outPoint!.index),
        },
        depType: parseInt(serializeDepType(cellDep.depType)),
      })),
      headerDeps: tx.headerDeps,
      inputs: tx.inputs.map((input) => ({
        previousOutput: {
          txHash: input.previousOutput!.txHash,
          index: parseInt(input.previousOutput!.index),
        },
        since: input.since,
      })),
      outputs: tx.outputs.map((output) => ({
        capacity: output.capacity,
        lock: {
          codeHash: output.lock.codeHash,
          hashType: parseInt(serializeHashType(output.lock.hashType)),
          args: output.lock.args,
        },
        ...(output.type && {
          codeHash: output.type.codeHash,
          hashType: parseInt(serializeHashType(output.type.hashType)),
          args: output.type.args,
        }),
      })),
      outputsData: tx.outputsData,
    };
  }

  /**
   * Construct an AnnotatedTransaction for a given collection of signing data
   *
   * Parameters are the same as for signTransaction, but no ledger interaction is attempted.
   *
   * AnnotatedTransaction is a type defined for the ledger app that collects
   * all of the information needed to securely confirm a transaction on-screen
   * and a few bits of duplicative information to allow it to be processed as a
   * stream.
   */
  buildAnnotatedTransaction(
    signPath: string,
    changePath: string,
    rawTx: RawTransaction,
    rawContextsTx: RawTransaction[],
    groupWitnesses?: string[]
  ): AnnotatedTransaction {
    return {
      signPath: BIPPath.fromString(signPath).toPathArray(),
      changePath: BIPPath.fromString(changePath).toPathArray(),
      inputCount: rawTx.inputs.length,
      raw: {
        version: rawTx.version,
        cellDeps: rawTx.cellDeps,
        headerDeps: rawTx.headerDeps,
        inputs: rawTx.inputs.map((input, idx) => ({
          input,
          source: rawContextsTx[idx],
        })),
        outputs: rawTx.outputs,
        outputsData: rawTx.outputsData,
      },
      witnesses:
        Array.isArray(groupWitnesses) && groupWitnesses.length > 0
          ? groupWitnesses
          : [this.defaultSighashWitness],
    };
  }

  /**
   * Sign an already constructed AnnotatedTransaction.
   */
  async signAnnotatedTransaction(tx: AnnotatedTransaction): Promise<string> {
    const rawAnTx = Buffer.from(SerializeAnnotatedTransaction(tx));

    const maxApduSize = 230;

    const txFullChunks = Math.floor(rawAnTx.byteLength / maxApduSize);
    let isContinuation = 0x00;
    for (let i = 0; i < txFullChunks; i++) {
      const data = rawAnTx.slice(i * maxApduSize, (i + 1) * maxApduSize);
      await this.transport.send(CLA, INS.SIGN, isContinuation, 0x00, data);
      isContinuation = 0x01;
    }

    const lastOffset = txFullChunks * maxApduSize;
    const lastData = rawAnTx.slice(lastOffset, lastOffset + maxApduSize);
    const response = await this.transport.send(
      CLA,
      INS.SIGN,
      isContinuation | 0x80,
      0x00,
      lastData
    );
    return response.slice(0, 65).toString("hex");
  }

  /**
   * An empty WitnessArgs with enough space to fit a sighash signature into.
   */
  defaultSighashWitness =
    "55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
}
