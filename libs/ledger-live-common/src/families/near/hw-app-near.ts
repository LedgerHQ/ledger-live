import type Transport from "@ledgerhq/hw-transport";
import { PublicKey } from "near-api-js/lib/utils";
import { KeyType } from "near-api-js/lib/utils/key_pair";
import { bip32PathToBytes, NETWORK_ID } from "./logic";

async function createClient(transport) {
  return {
    transport,
    async getPublicKey(path, verify) {
      const response = await this.transport.send(
        0x80,
        4,
        verify ? 0 : 1,
        NETWORK_ID,
        bip32PathToBytes(path)
      );
      return Buffer.from(response.subarray(0, -2));
    },
    async getAddress(path) {
      const response = await this.transport.send(
        0x80,
        5,
        0,
        NETWORK_ID,
        bip32PathToBytes(path)
      );
      return Buffer.from(response.subarray(0, -2));
    },
    async sign(transactionData, path) {
      transactionData = Buffer.from(transactionData);
      // 128 - 5 service bytes
      const CHUNK_SIZE = 123;
      const allData = Buffer.concat([bip32PathToBytes(path), transactionData]);
      for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
        const chunk = Buffer.from(
          allData.subarray(offset, offset + CHUNK_SIZE)
        );
        const isLastChunk = offset + CHUNK_SIZE >= allData.length;
        const response = await this.transport.send(
          0x80,
          2,
          isLastChunk ? 0x80 : 0,
          NETWORK_ID,
          chunk
        );
        if (isLastChunk) {
          return Buffer.from(response.subarray(0, -2));
        }
      }
    },
  };
}

export default class Near {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  async getAddress(
    path: string,
    verify?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const client = await createClient(this.transport);

    if (verify) {
      await client.getAddress(path);
    }

    const rawPublicKey = await client.getPublicKey(path, false);

    const publicKey = new PublicKey({
      keyType: KeyType.ED25519,
      data: rawPublicKey,
    });

    return {
      address: rawPublicKey.toString("hex"),
      publicKey: publicKey.toString(),
    };
  }

  async signTransaction(
    transaction: Uint8Array,
    path: string
  ): Promise<Buffer | undefined> {
    const client = await createClient(this.transport);
    const signature = await client.sign(transaction, path);

    return signature;
  }
}
