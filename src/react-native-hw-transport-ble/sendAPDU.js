// @flow

import uuid from "uuid/v4";
import { Observable } from "rxjs";
import { logSubject } from "./debug";
import type { BleManager, Characteristic } from "./types";

const TagId = 0x05;

function chunkBuffer(
  buffer: Buffer,
  sizeForIndex: number => number,
): Array<Buffer> {
  const chunks = [];
  for (
    let i = 0, size = sizeForIndex(0);
    i < buffer.length;
    i += size, size = sizeForIndex(i)
  ) {
    chunks.push(buffer.slice(i, i + size));
  }
  return chunks;
}

export const sendAPDU = (
  bleManager: BleManager,
  characteristic: Characteristic,
  apdu: Buffer,
  mtuSize: number,
) => {
  const chunks = chunkBuffer(apdu, i => mtuSize - (i === 0 ? 5 : 3)).map(
    (buffer, i) => {
      const head = Buffer.alloc(i === 0 ? 5 : 3);
      head.writeUInt8(TagId, 0);
      head.writeUInt16BE(i, 1);
      if (i === 0) {
        head.writeUInt16BE(apdu.length, 3);
      }
      return Buffer.concat([head, buffer]);
    },
  );

  return Observable.create(o => {
    let terminated = false;
    const txId = uuid();

    async function main() {
      for (const chunk of chunks) {
        if (terminated) return;
        const message = chunk.toString("base64");
        logSubject.next({
          type: "ble-frame-out",
          message: chunk.toString("hex"),
        });
        await characteristic.writeWithResponse(message, txId);
      }
      terminated = true;
    }

    main().then(
      () => {
        o.complete();
      },
      e => {
        o.error(e);
      },
    );

    const unsubscribe = () => {
      if (!terminated) {
        terminated = true;
        bleManager.cancelTransaction(txId);
      }
    };

    return unsubscribe;
  });
};
