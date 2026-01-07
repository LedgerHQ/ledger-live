import Transport from "@ledgerhq/hw-transport";

import { StatusCodes } from "@ledgerhq/errors";

import BIPPath from "bip32-path";
import { DescriptorInput, buildDescriptor } from "./descriptor";

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const P2_INIT = 0x00;
const P2_EXTEND = 0x01;
const P2_MORE = 0x02;
const P2_USER_INPUT_ATA = 0x08;

const MAX_PAYLOAD = 255;

const LEDGER_CLA = 0xe0;

const INS = {
  GET_VERSION: 0x04,
  GET_ADDR: 0x05,
  SIGN: 0x06,
  SIGN_OFFCHAIN: 0x07,
  GET_CHALLENGE: 0x20,
  PROVIDE_TRUSTED_NAME: 0x21,
  PROVIDE_TRUSTED_DYNAMIC_DESCRIPTOR: 0x22,
};

enum EXTRA_STATUS_CODES {
  BLIND_SIGNATURE_REQUIRED = 0x6808,
}

/**
 * Solana API
 *
 * @param transport a transport for sending commands to a device
 * @param scrambleKey a scramble key
 *
 * @example
 * import Solana from "@ledgerhq/hw-app-solana";
 * const solana = new Solana(transport);
 */
export default class Solana {
  private transport: Transport;

  constructor(
    transport: Transport,
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    scrambleKey: string = "solana_default_scramble_key",
  ) {
    this.transport = transport;
    this.transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "signTransaction",
        "getAppConfiguration",
        "getChallenge",
        "provideTrustedName",
        "provideTrustedDynamicDescriptor",
      ],
      scrambleKey,
    );
  }

  /**
   * Get Solana address (public key) for a BIP32 path.
   *
   * Because Solana uses Ed25519 keypairs, as per SLIP-0010
   * all derivation-path indexes will be promoted to hardened indexes.
   *
   * @param path a BIP32 path
   * @param display flag to show display
   * @returns an object with the address field
   *
   * @example
   * solana.getAddress("44'/501'/0'").then(r => r.address)
   */
  async getAddress(
    path: string,
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    display: boolean = false,
  ): Promise<{
    address: Buffer;
  }> {
    const pathBuffer = this.pathToBuffer(path);

    const addressBuffer = await this.sendToDevice(
      INS.GET_ADDR,
      display ? P1_CONFIRM : P1_NON_CONFIRM,
      pathBuffer,
    );

    return {
      address: addressBuffer,
    };
  }

  /**
   * Provides trusted dynamic and signed coin metadata
   *
   * @param data An object containing the descriptor and its signature from the CAL
   */
  async provideTrustedDynamicDescriptor(data: DescriptorInput): Promise<boolean> {
    await this.sendToDevice(
      INS.PROVIDE_TRUSTED_DYNAMIC_DESCRIPTOR,
      P1_NON_CONFIRM,
      buildDescriptor(data),
    );

    return true;
  }

  /**
   * Sign a Solana transaction.
   *
   * @param path a BIP32 path
   * @param txBuffer serialized transaction
   * @param userInputType optional user input type (ata or sol, for the case of token transfers)
   *
   * @returns an object with the signature field
   *
   * @example
   * solana.signTransaction("44'/501'/0'", txBuffer).then(r => r.signature)
   */
  async signTransaction(
    path: string,
    txBuffer: Buffer,
    userInputType?: "ata" | "sol",
  ): Promise<{
    signature: Buffer;
  }> {
    const pathBuffer = this.pathToBuffer(path);
    // Ledger app supports only a single derivation path per call ATM
    const pathsCountBuffer = Buffer.alloc(1);
    pathsCountBuffer.writeUInt8(1, 0);

    const payload = Buffer.concat([pathsCountBuffer, pathBuffer, txBuffer]);

    const p2Flag = userInputType === "ata" ? P2_USER_INPUT_ATA : undefined;
    const signatureBuffer = await this.sendToDevice(INS.SIGN, P1_CONFIRM, payload, p2Flag);

    return {
      signature: signatureBuffer,
    };
  }

  /**
   * Sign a Solana off-chain message.
   *
   * @param path a BIP32 path
   * @param msgBuffer serialized off-chain message
   *
   * @returns an object with the signature field
   *
   * @example
   * solana.signOffchainMessage("44'/501'/0'", msgBuffer).then(r => r.signature)
   */
  async signOffchainMessage(
    path: string,
    msgBuffer: Buffer,
  ): Promise<{
    signature: Buffer;
  }> {
    const pathBuffer = this.pathToBuffer(path);
    // Ledger app supports only a single derivation path per call ATM
    const pathsCountBuffer = Buffer.alloc(1);
    pathsCountBuffer.writeUInt8(1, 0);

    const payload = Buffer.concat([pathsCountBuffer, pathBuffer, msgBuffer]);

    const signatureBuffer = await this.sendToDevice(INS.SIGN_OFFCHAIN, P1_CONFIRM, payload);

    return {
      signature: signatureBuffer,
    };
  }

  /**
   * Get application configuration.
   *
   * @returns application config object
   *
   * @example
   * solana.getAppConfiguration().then(r => r.version)
   */
  async getAppConfiguration(): Promise<AppConfig> {
    const [blindSigningEnabled, pubKeyDisplayMode, major, minor, patch] = await this.sendToDevice(
      INS.GET_VERSION,
      P1_NON_CONFIRM,
      Buffer.alloc(0),
    );
    return {
      blindSigningEnabled: Boolean(blindSigningEnabled),
      pubKeyDisplayMode,
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * Method returning a 4 bytes TLV challenge as an hex string
   *
   * @returns {Promise<string>}
   */
  async getChallenge(): Promise<string> {
    return this.transport.send(LEDGER_CLA, INS.GET_CHALLENGE, P1_NON_CONFIRM, P2_INIT).then(res => {
      const data = res.toString("hex");
      const fourBytesChallenge = data.slice(0, -4);
      const statusCode = data.slice(-4);

      if (statusCode !== "9000") {
        throw new Error(
          `An error happened while generating the challenge. Status code: ${statusCode}`,
        );
      }
      return `0x${fourBytesChallenge}`;
    });
  }

  /**
   * Provides a trusted name to be displayed during transactions in place of the token address it is associated to. It shall be run just before a transaction involving the associated address that would be displayed on the device.
   *
   * @param data a stringified buffer of some TLV encoded data to represent the trusted name
   * @returns a boolean
   */
  async provideTrustedName(data: string): Promise<boolean> {
    await this.transport.send(
      LEDGER_CLA,
      INS.PROVIDE_TRUSTED_NAME,
      P1_NON_CONFIRM,
      P2_INIT,
      Buffer.from(data, "hex"),
    );

    return true;
  }

  private pathToBuffer(originalPath: string) {
    const path = originalPath
      .split("/")
      .map(value => (value.endsWith("'") || value.endsWith("h") ? value : value + "'"))
      .join("/");
    const pathNums: number[] = BIPPath.fromString(path).toPathArray();
    return this.serializePath(pathNums);
  }

  private serializePath(path: number[]) {
    const buf = Buffer.alloc(1 + path.length * 4);
    buf.writeUInt8(path.length, 0);
    for (const [i, num] of path.entries()) {
      buf.writeUInt32BE(num, 1 + i * 4);
    }
    return buf;
  }

  // send chunked if payload size exceeds maximum for a call
  private async sendToDevice(instruction: number, p1: number, payload: Buffer, p2 = P2_INIT) {
    /*
     * By default transport will throw if status code is not OK.
     * For some payloads we need to enable blind sign in the app settings
     * and this is reported with StatusCodes.MISSING_CRITICAL_PARAMETER first byte prefix
     * so we handle it and show a user friendly error message.
     */
    const acceptStatusList = [StatusCodes.OK, EXTRA_STATUS_CODES.BLIND_SIGNATURE_REQUIRED];
    let payload_offset = 0;

    if (payload.length > MAX_PAYLOAD) {
      while (payload.length - payload_offset > MAX_PAYLOAD) {
        const buf = payload.slice(payload_offset, payload_offset + MAX_PAYLOAD);
        payload_offset += MAX_PAYLOAD;
        // console.log( "send", (p2 | P2_MORE).toString(16), buf.length.toString(16), buf);
        const reply = await this.transport.send(
          LEDGER_CLA,
          instruction,
          p1,
          p2 | P2_MORE,
          buf,
          acceptStatusList,
        );
        this.throwOnFailure(reply);
        p2 |= P2_EXTEND;
      }
    }

    const buf = payload.slice(payload_offset);
    // console.log("send", p2.toString(16), buf.length.toString(16), buf);
    const reply = await this.transport.send(LEDGER_CLA, instruction, p1, p2, buf, acceptStatusList);

    this.throwOnFailure(reply);

    return reply.slice(0, reply.length - 2);
  }

  private throwOnFailure(reply: Buffer) {
    // transport makes sure reply has a valid length
    const status = reply.readUInt16BE(reply.length - 2);

    switch (status) {
      case EXTRA_STATUS_CODES.BLIND_SIGNATURE_REQUIRED:
        throw new Error("Missing a parameter. Try enabling blind signature in the app");
      default:
        return;
    }
  }
}

enum PubKeyDisplayMode {
  LONG,
  SHORT,
}

type AppConfig = {
  blindSigningEnabled: boolean;
  pubKeyDisplayMode: PubKeyDisplayMode;
  version: string;
};
