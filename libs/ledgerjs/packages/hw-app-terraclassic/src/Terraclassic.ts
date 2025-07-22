/********************************************************************************
 *   Ledger Node JS API for Terra Classic
 *   (c) 2025 Your Org
 *  Licensed under the Apache License, Version 2.0 (the "License");
 ********************************************************************************/
import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { encodeTerraAddress } from "./utils"; // You must implement this (bech32 terra1...)

const CHUNK_SIZE = 250;

// Terra Classic/Cosmos spec — replace with actual CLA/INS for Terra Classic!
const CLA = 0x55;                 // Example, update per Terra Classic app!
const INS_GET_PUBLIC_KEY = 0x02;  // Example, update per Terra Classic app!
const INS_SIGN = 0x04;            // Example, update per Terra Classic app!

const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;
const P1_CONFIRM = 0x01;          // Usually 0x01 for requiring user confirmation

export default class TerraClassic {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "sign"], "TERRA");
  }

  /**
   * Get Terra Classic address for a given BIP 32 path.
   * @param path a path in BIP 32 format, e.g. "44'/330'/0'/0/0"
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey and address (bech32 terra1...)
   */
  async getAddress(
    path: string,
    boolDisplay?: boolean,
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    // Cosmos SDK apps expect the full path as a buffer
    const pathBuf = Buffer.alloc(1 + bipPath.length * 4);
    pathBuf[0] = bipPath.length;
    bipPath.forEach((element, i) => pathBuf.writeUInt32BE(element, 1 + 4 * i));

    const response = await this.transport.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      boolDisplay ? P1_CONFIRM : 0x00,
      0x00,
      pathBuf,
      [SW_OK]
    );
    const publicKey = response.slice(0, 33).toString("hex"); // Cosmos/Terra usually 33 bytes
    const address = encodeTerraAddress(response.slice(0, 33)); // bech32 terra1...
    return { publicKey, address };
  }

  foreach<T, A>(arr: T[], callback: (arg0: T, arg1: number) => Promise<A>): Promise<A[]> {
    function iterate(index, array, result) {
      if (index >= array.length) {
        return result;
      } else
        return callback(array[index], index).then(function (res) {
          result.push(res);
          return iterate(index + 1, array, result);
        });
    }
    return Promise.resolve().then(() => iterate(0, arr, []));
  }

  /**
   * Sign a Terra Classic transaction
   * @param path BIP32 path (e.g. "44'/330'/0'/0/0")
   * @param message Amino or Protobuf-encoded transaction (as hex string)
   * @returns signature buffer
   */
  async sign(
    path: string,
    message: string,
  ): Promise<{
    signature: null | Buffer;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const pathBuf = Buffer.alloc(1 + bipPath.length * 4);
    pathBuf[0] = bipPath.length;
    bipPath.forEach((element, i) => pathBuf.writeUInt32BE(element, 1 + 4 * i));
    const txData = Buffer.from(message, "hex");
    const buffer = Buffer.concat([pathBuf, txData]);

    const chunks: Buffer[] = [];
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (end > buffer.length) end = buffer.length;
      chunks.push(buffer.slice(i, end));
    }

    let response: any = {};
    await this.foreach(chunks, (data, j) =>
      this.transport
        .send(
          CLA,
          INS_SIGN,
          j === 0 ? 0x00 : 0x80,
          j + 1 === chunks.length ? 0x00 : 0x80,
          data,
          [SW_OK, SW_CANCEL],
        )
        .then(apduResponse => (response = apduResponse)),
    );

    if (response === SW_CANCEL) {
      throw new UserRefusedOnDevice();
    }

    let signature = null;
    if (response.length > 0) {
      signature = response.slice(0, response.length);
    }

    return { signature };
  }
}
