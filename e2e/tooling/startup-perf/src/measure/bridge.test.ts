import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFrames, encodeFrame } from "./bridge.ts";

const MASK = Buffer.from([0x12, 0x34, 0x56, 0x78]);

function lengthBytes(len: number): number[] {
  if (len < 126) return [len];
  if (len < 65536) return [126, len >> 8, len & 0xff];
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(len));
  return [127, ...bytes];
}

/** A frame as the app sends it: masked, like every client frame. */
function clientFrame(text: string, { fin = true, opcode = 0x1 } = {}): Buffer {
  const payload = Buffer.from(text, "utf8");
  const [first, ...extended] = lengthBytes(payload.length);
  const header = Buffer.from([(fin ? 0x80 : 0) | opcode, 0x80 | first, ...extended]);
  const masked = Buffer.from(payload.map((byte, i) => byte ^ MASK[i % 4]));
  return Buffer.concat([header, MASK, masked]);
}

const texts = (frames: Array<{ data: Buffer }>) => frames.map(f => f.data.toString("utf8"));

describe("decodeFrames", () => {
  it("unmasks a client text frame", () => {
    const { frames, rest } = decodeFrames(clientFrame('{"type":"ACK"}'));
    assert.deepEqual(texts(frames), ['{"type":"ACK"}']);
    assert.equal(frames[0].fin, true);
    assert.equal(frames[0].opcode, 0x1);
    assert.equal(rest.length, 0);
  });

  it("reads the 16-bit and 64-bit payload lengths", () => {
    const medium = "m".repeat(300);
    const large = "l".repeat(70_000);
    const { frames } = decodeFrames(Buffer.concat([clientFrame(medium), clientFrame(large)]));
    assert.deepEqual(texts(frames), [medium, large]);
  });

  it("keeps an incomplete frame for the next chunk", () => {
    const frame = clientFrame("x".repeat(200));
    const first = decodeFrames(frame.subarray(0, 3));
    assert.equal(first.frames.length, 0);
    assert.equal(first.rest.length, 3);
    const second = decodeFrames(Buffer.concat([first.rest, frame.subarray(3)]));
    assert.deepEqual(texts(second.frames), ["x".repeat(200)]);
  });

  it("keeps the fragments and control frames apart", () => {
    const chunk = Buffer.concat([
      clientFrame("par", { fin: false }),
      clientFrame("", { opcode: 0x9 }),
      clientFrame("tial", { opcode: 0x0 }),
    ]);
    const { frames } = decodeFrames(chunk);
    assert.deepEqual(
      frames.map(f => [f.fin, f.opcode, f.data.toString("utf8")]),
      [
        [false, 0x1, "par"],
        [true, 0x9, ""],
        [true, 0x0, "tial"],
      ],
    );
  });
});

describe("encodeFrame", () => {
  for (const len of [5, 300, 70_000]) {
    it(`frames ${len} bytes unmasked, with the length form the size needs`, () => {
      const frame = encodeFrame("e".repeat(len));
      const { frames, rest } = decodeFrames(frame);
      assert.equal(frame[0], 0x81);
      assert.deepEqual(texts(frames), ["e".repeat(len)]);
      assert.equal(rest.length, 0);
    });
  }
});
