import type Transport from "@ledgerhq/hw-transport";
import { Address } from "@multiversx/sdk-core";
import BIPPath from "bip32-path";

const CHUNK_SIZE = 150;
const CURVE_MASK = 0x80;
const CLA = 0xed;
const INS = {
  GET_VERSION: 0x02,
  GET_ADDRESS: 0x03,
  SET_ADDRESS: 0x05,
  PROVIDE_ESDT_INFO: 0x08,
};
const SIGN_HASH_TX_INS = 0x07;
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;

/**
 * MultiversX API
 *
 * @example
 * import MultiversX from "@ledgerhq/hw-app-multiversx";
 * const multiversx = new MultiversX(transport)
 */
export default class MultiversX {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "eGLD") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "setAddress",
        "signTransaction",
        "signMessage",
        "getAppConfiguration",
        "provideESDTInfo",
      ],
      scrambleKey,
    );
  }

  /**
   * Get MultiversX app configuration.
   *
   * @return an object with a contractData, accountIndex, addressIndex, version
   * @example
   * const result = await multiversx.getAppConfiguration();
   * const { contractData, accountIndex, addressIndex, version } = result;
   */
  async getAppConfiguration(): Promise<any> {
    const response = await this.transport.send(CLA, INS.GET_VERSION, 0x00, 0x00);
    return {
      contractData: response[0],
      accountIndex: response[1],
      addressIndex: response[2],
      version: `${response[3]}.${response[4]}.${response[5]}`,
    };
  }

  serializePath(path: Array<number>) {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(path[3], 0);
    buf.writeUInt32BE(path[2], 4);
    return buf;
  }

  /**
   * Get MultiversX address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param boolDisplay optionally enable or not the display
   * @return an object with a address
   * @example
   * const result = await multiversx.getAddress("44'/508'/0'/0'/0'");
   * const { publicKey, address } = result;
   */
  async getAddress(
    path: string,
    boolDisplay?: boolean,
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const data = this.serializePath(bipPath);
    const response = await this.transport.send(
      CLA,
      INS.GET_ADDRESS,
      boolDisplay ? 0x01 : 0x00,
      0x00,
      data,
      [SW_OK, SW_CANCEL],
    );

    const addressLength = response[0];
    const address = Address.newFromBech32(response.slice(1, 1 + addressLength).toString("ascii"));

    return {
      publicKey: address.toHex(),
      address: address.toBech32(),
    };
  }

  /**
   * Set MultiversX address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param display optionally enable or not the display
   * @return an object with a address
   * @example
   * const result = await multiversx.setAddress("44'/508'/0'/0/0");
   * result : Buffer;
   */
  async setAddress(path: string, display?: boolean) {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const data = this.serializePath(bipPath);
    await this.transport.send(CLA, INS.SET_ADDRESS, display ? 0x01 : 0x00, 0x00, data, [
      SW_OK,
      SW_CANCEL,
    ]);
  }

  async signTransaction(path: string, message: string): Promise<string> {
    const { signature } = await this.sign(path, message);

    if (signature === null) {
      throw new Error("null signature received");
    }

    return signature.toString("hex");
  }

  async sign(path: string, message: string): Promise<{ signature: null | Buffer }> {
    const chunks: Buffer[] = [];
    const buffer: Buffer = Buffer.from(message);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;

      if (i > buffer.length) {
        end = buffer.length;
      }

      chunks.push(buffer.slice(i, end));
    }

    const apdus: any[] = [];
    chunks.forEach((data, index) => {
      const apdu: any = {
        cla: CLA,
        ins: SIGN_HASH_TX_INS,
        p1: index === 0 ? 0x00 : CURVE_MASK,
        p2: CURVE_MASK,
        data,
      };
      apdus.push(apdu);
    });

    let response: any = {};
    for (const apdu of apdus) {
      response = await this.transport.send(apdu.cla, apdu.ins, apdu.p1, apdu.p2, apdu.data);
    }

    if (response.length !== 67 || response[0] !== 64) {
      throw new Error("invalid signature received from ledger device");
    }

    const signature = response.slice(1, response.length - 2).toString("hex");
    return { signature };
  }

  serializeESDTInfo(
    ticker: string,
    id: string,
    decimals: number,
    chainId: string,
    signature: string,
  ): Buffer {
    const tickerLengthBuffer = Buffer.from([ticker.length]);
    const tickerBuffer = Buffer.from(ticker);
    const idLengthBuffer = Buffer.from([id.length]);
    const idBuffer = Buffer.from(id);
    const decimalsBuffer = Buffer.from([decimals]);
    const chainIdLengthBuffer = Buffer.from([chainId.length]);
    const chainIdBuffer = Buffer.from(chainId);
    const signatureBuffer = Buffer.from(signature, "hex");
    const infoBuffer = [
      tickerLengthBuffer,
      tickerBuffer,
      idLengthBuffer,
      idBuffer,
      decimalsBuffer,
      chainIdLengthBuffer,
      chainIdBuffer,
      signatureBuffer,
    ];
    return Buffer.concat(infoBuffer);
  }

  async provideESDTInfo(
    ticker?: string,
    id?: string,
    decimals?: number,
    chainId?: string,
    signature?: string,
  ): Promise<any> {
    if (!ticker || !id || !decimals || !chainId || !signature) {
      throw new Error("Invalid ESDT token credentials!");
    }

    const data = this.serializeESDTInfo(ticker, id, decimals, chainId, signature);

    return await this.transport.send(CLA, INS.PROVIDE_ESDT_INFO, 0x00, 0x00, data);
  }
}
