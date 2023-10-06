import { Observable } from "rxjs";
import { TraceContext, trace } from "@ledgerhq/logs";
const TagId = 0x05;

/**
 * Creates a list of chunked buffer from one buffer
 *
 * If this is using a Node buffer: the chunked buffers reference to the same memory as the original buffer.
 * If this is using a Uint8Array: each part of the original buffer is copied into the chunked buffers
 *
 * @param buffer a Node Buffer, or a Uint8Array
 * @param sizeForIndex A function that takes an index (on the buffer) and returns the size of the chunk at that index
 * @returns a list of chunked buffers
 */
function createChunkedBuffers(
  buffer: Buffer,
  sizeForIndex: (arg0: number) => number,
): Array<Buffer> {
  const chunks: Buffer[] = [];

  for (let i = 0, size = sizeForIndex(0); i < buffer.length; i += size, size = sizeForIndex(i)) {
    // If this is a Node buffer: this chunked buffer points to the same memory but with cropped starting and ending indices
    // `slice` and not `subarray`: this might not be a Node Buffer, but probably only a Uint8Array.
    chunks.push(buffer.slice(i, i + size));
  }

  return chunks;
}

/**
 * Sends an APDU by encoding it into chunks and sending the chunks using the given `write` function
 *
 * @param write The function to send each chunk to the device
 * @param apdu
 * @param mtuSize The negotiated maximum size of the data to be sent in one chunk
 * @param options Optional options containing:
 *   - context An optional context object for log/tracing strategy
 * @returns An observable that will only emit if an error occurred, otherwise it will complete
 */
export const sendAPDU = (
  write: (arg0: Buffer) => Promise<void>,
  apdu: Buffer,
  mtuSize: number,
  { context }: { context?: TraceContext } = {},
): Observable<Buffer> => {
  // Prepares the data to be sent in chunks, by adding a header to chunked of the APDU
  // The first chunk will contain the total length of the APDU, which reduces the size of the data written in the first chunk.
  // The total length of the APDU is encoded in 2 bytes (so 5 bytes for the header with the tag id and the chunk index).
  const chunks = createChunkedBuffers(apdu, i => mtuSize - (i === 0 ? 5 : 3)).map((buffer, i) => {
    const head = Buffer.alloc(i === 0 ? 5 : 3);
    head.writeUInt8(TagId, 0);
    // Index of the chunk as the 2 next bytes
    head.writeUInt16BE(i, 1);

    // The total length of the APDU is written on the first chunk
    if (i === 0) {
      head.writeUInt16BE(apdu.length, 3);
    }

    // No 0-padding is needed
    return Buffer.concat([head, buffer]);
  });

  return new Observable(o => {
    let terminated = false;

    async function main() {
      for (const chunk of chunks) {
        if (terminated) return;
        await write(chunk);
      }
    }

    main().then(
      () => {
        terminated = true;
        o.complete();
      },
      error => {
        terminated = true;
        trace({
          type: "ble-error",
          message: `sendAPDU failure: ${error}`,
          data: { error },
          context,
        });
        o.error(error);
      },
    );

    const unsubscribe = () => {
      if (!terminated) {
        trace({
          type: "ble-error",
          message: "sendAPDU interruption",
          context,
        });
        terminated = true;
      }
    };

    return unsubscribe;
  });
};
