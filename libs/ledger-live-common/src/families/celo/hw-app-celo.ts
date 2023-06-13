import type Transport from "@ledgerhq/hw-transport";
import { decode, encode } from "rlp";

/**
 * Heavily inspiried by celo-web-wallet
 * https://github.com/celo-tools/celo-web-wallet/blob/master/src/features/ledger/CeloLedgerApp.ts
 */
export class CeloApp {
  transport: Transport;

  constructor(transport: any) {
    this.transport = transport;
  }

  async signTransaction(
    path: string,
    rawTxHex: string,
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    const paths = splitPath(path);
    const rawTx = Buffer.from(rawTxHex, "hex");
    let offset = 0;
    let response;

    const rlpTx = decode(rawTx);
    let rlpOffset = 0;
    if (rlpTx.length > 6) {
      const rlpVrs = encode(rlpTx.slice(-3));
      rlpOffset = rawTx.length - (rlpVrs.length - 1);
    }

    while (offset !== rawTx.length) {
      const first = offset === 0;
      const maxChunkSize = first ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize = offset + maxChunkSize > rawTx.length ? rawTx.length - offset : maxChunkSize;
      if (rlpOffset != 0 && offset + chunkSize == rlpOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize--;
      }
      const buffer = Buffer.alloc(first ? 1 + paths.length * 4 + chunkSize : chunkSize);
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
        .catch(e => {
          throw e;
        });

      offset += chunkSize;
    }

    const v = response.slice(0, 1).toString("hex");
    const r = response.slice(1, 1 + 32).toString("hex");
    const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
    return { v, r, s };
  }

  provideERC20TokenInformation({ data }: { data: Buffer }): Promise<boolean> {
    return provideERC20TokenInformation(this.transport, data);
  }
}

function splitPath(path: string): number[] {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach(element => {
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

function provideERC20TokenInformation(transport: Transport, data: Buffer): Promise<boolean> {
  return transport.send(0xe0, 0x0a, 0x00, 0x00, data).then(
    () => true,
    e => {
      if (e && e.statusCode === 0x6d00) {
        return false;
      }
      throw e;
    },
  );
}
