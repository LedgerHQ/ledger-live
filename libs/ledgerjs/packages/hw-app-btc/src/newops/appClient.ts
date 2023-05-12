import Transport from "@ledgerhq/hw-transport";
import { pathElementsToBuffer } from "../bip32";
import { PsbtV2 } from "./psbtv2";
import { MerkelizedPsbt } from "./merkelizedPsbt";
import { ClientCommandInterpreter } from "./clientCommands";
import { WalletPolicy } from "./policy";
import { createVarint } from "../varint";
import { hashLeaf, Merkle } from "./merkle";

const CLA_BTC = 0xe1;
const CLA_FRAMEWORK = 0xf8;

enum BitcoinIns {
  GET_PUBKEY = 0x00,
  // GET_ADDRESS = 0x01, // Removed from app
  REGISTER_WALLET = 0x02,
  GET_WALLET_ADDRESS = 0x03,
  SIGN_PSBT = 0x04,
  GET_MASTER_FINGERPRINT = 0x05,
  SIGN_MESSAGE = 0x10,
}

enum FrameworkIns {
  CONTINUE_INTERRUPTED = 0x01,
}

/**
 * This class encapsulates the APDU protocol documented at
 * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md
 */
export class AppClient {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  private async makeRequest(
    ins: BitcoinIns,
    data: Buffer,
    cci?: ClientCommandInterpreter
  ): Promise<Buffer> {
    let response: Buffer = await this.transport.send(
      CLA_BTC,
      ins,
      0,
      0,
      data,
      [0x9000, 0xe000]
    );
    while (response.readUInt16BE(response.length - 2) === 0xe000) {
      if (!cci) {
        throw new Error("Unexpected SW_INTERRUPTED_EXECUTION");
      }

      const hwRequest = response.slice(0, -2);
      const commandResponse = cci.execute(hwRequest);

      response = await this.transport.send(
        CLA_FRAMEWORK,
        FrameworkIns.CONTINUE_INTERRUPTED,
        0,
        0,
        commandResponse,
        [0x9000, 0xe000]
      );
    }
    return response.slice(0, -2); // drop the status word (can only be 0x9000 at this point)
  }

  async getExtendedPubkey(
    display: boolean,
    pathElements: number[]
  ): Promise<string> {
    if (pathElements.length > 6) {
      throw new Error("Path too long. At most 6 levels allowed.");
    }
    const response = await this.makeRequest(
      BitcoinIns.GET_PUBKEY,
      Buffer.concat([
        Buffer.from(display ? [1] : [0]),
        pathElementsToBuffer(pathElements),
      ])
    );
    return response.toString("ascii");
  }

  async getWalletAddress(
    walletPolicy: WalletPolicy,
    walletHMAC: Buffer | null,
    change: number,
    addressIndex: number,
    display: boolean
  ): Promise<string> {
    if (change !== 0 && change !== 1)
      throw new Error("Change can only be 0 or 1");
    if (addressIndex < 0 || !Number.isInteger(addressIndex))
      throw new Error("Invalid address index");

    if (walletHMAC != null && walletHMAC.length != 32) {
      throw new Error("Invalid HMAC length");
    }

    const clientInterpreter = new ClientCommandInterpreter(() => {});
    clientInterpreter.addKnownList(
      walletPolicy.keys.map((k) => Buffer.from(k, "ascii"))
    );
    clientInterpreter.addKnownPreimage(walletPolicy.serialize());

    const addressIndexBuffer = Buffer.alloc(4);
    addressIndexBuffer.writeUInt32BE(addressIndex, 0);

    const response = await this.makeRequest(
      BitcoinIns.GET_WALLET_ADDRESS,
      Buffer.concat([
        Buffer.from(display ? [1] : [0]),
        walletPolicy.getWalletId(),
        walletHMAC || Buffer.alloc(32, 0),
        Buffer.from([change]),
        addressIndexBuffer,
      ]),
      clientInterpreter
    );

    return response.toString("ascii");
  }

  async signPsbt(
    psbt: PsbtV2,
    walletPolicy: WalletPolicy,
    walletHMAC: Buffer | null,
    progressCallback: () => void
  ): Promise<Map<number, Buffer>> {
    const merkelizedPsbt = new MerkelizedPsbt(psbt);

    if (walletHMAC != null && walletHMAC.length != 32) {
      throw new Error("Invalid HMAC length");
    }

    const clientInterpreter = new ClientCommandInterpreter(progressCallback);

    // prepare ClientCommandInterpreter
    clientInterpreter.addKnownList(
      walletPolicy.keys.map((k) => Buffer.from(k, "ascii"))
    );
    clientInterpreter.addKnownPreimage(walletPolicy.serialize());

    clientInterpreter.addKnownMapping(merkelizedPsbt.globalMerkleMap);
    for (const map of merkelizedPsbt.inputMerkleMaps) {
      clientInterpreter.addKnownMapping(map);
    }
    for (const map of merkelizedPsbt.outputMerkleMaps) {
      clientInterpreter.addKnownMapping(map);
    }

    clientInterpreter.addKnownList(merkelizedPsbt.inputMapCommitments);
    const inputMapsRoot = new Merkle(
      merkelizedPsbt.inputMapCommitments.map((m) => hashLeaf(m))
    ).getRoot();
    clientInterpreter.addKnownList(merkelizedPsbt.outputMapCommitments);
    const outputMapsRoot = new Merkle(
      merkelizedPsbt.outputMapCommitments.map((m) => hashLeaf(m))
    ).getRoot();

    await this.makeRequest(
      BitcoinIns.SIGN_PSBT,
      Buffer.concat([
        merkelizedPsbt.getGlobalKeysValuesRoot(),
        createVarint(merkelizedPsbt.getGlobalInputCount()),
        inputMapsRoot,
        createVarint(merkelizedPsbt.getGlobalOutputCount()),
        outputMapsRoot,
        walletPolicy.getWalletId(),
        walletHMAC || Buffer.alloc(32, 0),
      ]),
      clientInterpreter
    );

    const yielded = clientInterpreter.getYielded();

    const ret: Map<number, Buffer> = new Map();
    for (const inputAndSig of yielded) {
      ret.set(inputAndSig[0], inputAndSig.slice(1));
    }
    return ret;
  }

  async getMasterFingerprint(): Promise<Buffer> {
    return this.makeRequest(BitcoinIns.GET_MASTER_FINGERPRINT, Buffer.from([]));
  }

  async signMessage(message: Buffer, pathElements: number[]): Promise<string> {
    if (pathElements.length > 6) {
      throw new Error("Path too long. At most 6 levels allowed.");
    }

    const clientInterpreter = new ClientCommandInterpreter(() => {});

    // prepare ClientCommandInterpreter
    const nChunks = Math.ceil(message.length / 64);
    const chunks: Buffer[] = [];
    for (let i = 0; i < nChunks; i++) {
      chunks.push(message.subarray(64 * i, 64 * i + 64));
    }

    clientInterpreter.addKnownList(chunks);
    const chunksRoot = new Merkle(chunks.map((m) => hashLeaf(m))).getRoot();

    const response = await this.makeRequest(
      BitcoinIns.SIGN_MESSAGE,
      Buffer.concat([
        pathElementsToBuffer(pathElements),
        createVarint(message.length),
        chunksRoot,
      ]),
      clientInterpreter
    );

    return response.toString("base64");
  }
}
