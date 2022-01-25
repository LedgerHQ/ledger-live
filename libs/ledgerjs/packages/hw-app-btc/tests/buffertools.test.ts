import { BufferReader, BufferWriter } from "../src/buffertools"

function run(n: number, expectedHex: string) {
  const w = new BufferWriter();
  w.writeUInt64(n)
  expect(w.buffer()).toEqual(Buffer.from(expectedHex, "hex"));
  const r = new BufferReader(w.buffer());
  expect(r.readUInt64()).toEqual(n);
}

test("Test 64 bit numbers", () => {
  run(0, "0000000000000000");
  run(1, "0100000000000000");
  run(0xffffffff,   "ffffffff00000000");
  run(0x0100000000, "0000000001000000");
  run(0x010203040506, "0605040302010000");
  run(Number.MAX_SAFE_INTEGER, "FFFFFFFFFFFF1F00");
})

test("Too big 64 bit number", () => {
  const w = new BufferWriter();
  expect(() => w.writeUInt64(Number.MAX_SAFE_INTEGER+1)).toThrow();
  const r = new BufferReader(Buffer.from("FFFFFFFFFFFF2000", "hex"))
  expect(() => r.readUInt64()).toThrow();
})
