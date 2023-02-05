import type Transport from "@ledgerhq/hw-transport";
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
const SIGN_RAW_TX_INS = 0x04;
const SIGN_HASH_TX_INS = 0x07;
const SIGN_MESSAGE_INS = 0x06;
const ACTIVE_SIGNERS = [SIGN_RAW_TX_INS, SIGN_HASH_TX_INS, SIGN_MESSAGE_INS];
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;
export default class Elrond {
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
      scrambleKey
    );
  }

  /**
   * Get Elrond app configuration.
   *
   * @return an object with a contractData, accountIndex, addressIndex, version
   * @example
   * const result = await elrond.getAppConfiguration();
   * const { contractData, accountIndex, addressIndex, version } = result;
   */
  async getAppConfiguration(): Promise<any> {
    const response = await this.transport.send(
      CLA,
      INS.GET_VERSION,
      0x00,
      0x00
    );
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
   * Get Elrond address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param display optionally enable or not the display
   * @return an object with a address
   * @example
   * const result = await elrond.getAddress("44'/508'/0'/0'/0'");
   * const { address, returnCode } = result;
   */
  async getAddress(
    path: string,
    display?: boolean
  ): Promise<{
    address: string;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const data = this.serializePath(bipPath);
    const response = await this.transport.send(
      CLA,
      INS.GET_ADDRESS,
      display ? 0x01 : 0x00,
      0x00,
      data,
      [SW_OK, SW_CANCEL]
    );
    const addressLength = response[0];
    const address = response.slice(1, 1 + addressLength).toString("ascii");
    return {
      address,
    };
  }

  /**
   * Set Elrond address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param display optionally enable or not the display
   * @return an object with a address
   * @example
   * const result = await elrond.setAddress("44'/508'/0'/0/0");
   * result : Buffer;
   */
  async setAddress(path: string, display?: boolean) {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const data = this.serializePath(bipPath);
    await this.transport.send(
      CLA,
      INS.SET_ADDRESS,
      display ? 0x01 : 0x00,
      0x00,
      data,
      [SW_OK, SW_CANCEL]
    );
  }

  async signTransaction(
    path: string,
    message: string,
    usingHash: boolean
  ): Promise<string> {
    const chunks: Buffer[] = [];
    const buffer: Buffer = Buffer.from(message);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;

      if (i > buffer.length) {
        end = buffer.length;
      }

      chunks.push(buffer.slice(i, end));
    }

    return usingHash
      ? this.sign(chunks, SIGN_HASH_TX_INS)
      : this.sign(chunks, SIGN_RAW_TX_INS);
  }

  async signMessage(message: Buffer[]): Promise<string> {
    return this.sign(message, SIGN_MESSAGE_INS);
  }

  async sign(message: Buffer[], type: number): Promise<string> {
    if (!ACTIVE_SIGNERS.includes(type)) {
      throw new Error(`invalid sign instruction called: ${type}`);
    }

    const apdus: any[] = [];
    message.forEach((data, index) => {
      const apdu: any = {
        cla: CLA,
        ins: type,
        p1: index === 0 ? 0x00 : CURVE_MASK,
        p2: CURVE_MASK,
        data,
      };
      apdus.push(apdu);
    });
    let response: any = {};

    for (const apdu of apdus) {
      response = await this.transport.send(
        apdu.cla,
        apdu.ins,
        apdu.p1,
        apdu.p2,
        apdu.data
      );
    }

    if (response.length !== 67 || response[0] !== 64) {
      throw new Error("invalid signature received from ledger device");
    }

    const signature = response.slice(1, response.length - 2).toString("hex");
    return signature;
  }

  serializeESDTInfo(
    ticker: string,
    id: string,
    decimals: number,
    chainId: string,
    signature: string
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
    signature?: string
  ): Promise<any> {
    if (!ticker || !id || !decimals || !chainId || !signature) {
      throw new Error("Invalid ESDT token credentials!");
    }

    const data = this.serializeESDTInfo(
      ticker,
      id,
      decimals,
      chainId,
      signature
    );

    return await this.transport.send(
      CLA,
      INS.PROVIDE_ESDT_INFO,
      0x00,
      0x00,
      data
    );
  }
}
