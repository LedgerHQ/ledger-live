import { TransportError } from "@ledgerhq/errors";

// Represents a response message from the device being reduced from HID USB frames/packets
export type ResponseAcc =
  | {
      data: Buffer;
      dataLength: number;
      // The current frame id/number
      sequence: number;
    }
  | null
  | undefined;

const Tag = 0x05;

function asUInt16BE(value) {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(value, 0);
  return b;
}

const initialAcc = {
  data: Buffer.alloc(0),
  dataLength: 0,
  sequence: 0,
};

/**
 * Object to handle HID frames (encoding and decoding)
 *
 * @param channel
 * @param packetSize The HID protocol packet size in bytes (usually 64)
 */
const createHIDframing = (channel: number, packetSize: number) => {
  return {
    /**
     * Frames/encodes an APDU message into HID USB packets/frames
     *
     * @param apdu The APDU message to send, in a Buffer containing [cla, ins, p1, p2, data length, data(if not empty)]
     * @returns an array of HID USB frames ready to be sent
     */
    makeBlocks(apdu: Buffer): Buffer[] {
      // Encodes the APDU length in 2 bytes before the APDU itself.
      // The length is measured as the number of bytes.
      // As the size of the APDU `data` should have been added in 1 byte just before `data`,
      // the minimum size of an APDU is 5 bytes.
      let data = Buffer.concat([asUInt16BE(apdu.length), apdu]);

      const blockSize = packetSize - 5;
      const nbBlocks = Math.ceil(data.length / blockSize);

      // Fills data with 0-padding
      data = Buffer.concat([data, Buffer.alloc(nbBlocks * blockSize - data.length + 1).fill(0)]);

      const blocks: Buffer[] = [];

      for (let i = 0; i < nbBlocks; i++) {
        const head = Buffer.alloc(5);
        head.writeUInt16BE(channel, 0);
        head.writeUInt8(Tag, 2);
        head.writeUInt16BE(i, 3);

        // `slice` and not `subarray`: this might not be a Node Buffer, but probably only a Uint8Array
        const chunk = data.slice(i * blockSize, (i + 1) * blockSize);

        blocks.push(Buffer.concat([head, chunk]));
      }

      return blocks;
    },

    /**
     * Reduces HID USB packets/frames to one response.
     *
     * @param acc The value resulting from (accumulating) the previous call of reduceResponse.
     *   On first call initialized to `initialAcc`. The accumulator enables handling multi-frames messages.
     * @param chunk Current chunk to reduce into accumulator
     * @returns An accumulator value updated with the current chunk
     */
    reduceResponse(acc: ResponseAcc, chunk: Buffer): ResponseAcc {
      let { data, dataLength, sequence } = acc || initialAcc;

      if (chunk.readUInt16BE(0) !== channel) {
        throw new TransportError("Invalid channel", "InvalidChannel");
      }

      if (chunk.readUInt8(2) !== Tag) {
        throw new TransportError("Invalid tag", "InvalidTag");
      }

      if (chunk.readUInt16BE(3) !== sequence) {
        throw new TransportError("Invalid sequence", "InvalidSequence");
      }

      // Gets the total length of the response from the 1st frame
      if (!acc) {
        dataLength = chunk.readUInt16BE(5);
      }

      sequence++;
      // The total length on the 1st frame takes 2 more bytes
      const chunkData = chunk.slice(acc ? 5 : 7);
      data = Buffer.concat([data, chunkData]);

      // Removes any 0 padding
      if (data.length > dataLength) {
        data = data.slice(0, dataLength);
      }

      return {
        data,
        dataLength,
        sequence,
      };
    },

    /**
     * Returns the response message that has been reduced from the HID USB frames
     *
     * @param acc The accumulator
     * @returns A Buffer containing the cleaned response message, or null if no response message, or undefined if the
     *   accumulator is incorrect (message length is not valid)
     */
    getReducedResult(acc: ResponseAcc): Buffer | null | undefined {
      if (acc && acc.dataLength === acc.data.length) {
        return acc.data;
      }
    },
  };
};

export default createHIDframing;
