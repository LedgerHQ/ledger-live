import { BufferReader, BufferWriter, unsafeFrom64bitLE, unsafeTo64bitLE } from "./buffertools";

describe("buffertools", () => {
  describe("unsafeTo64bitLE", () => {
    it("should roundtrip values within safe range", () => {
      const value = Number.MAX_SAFE_INTEGER - 1;
      const buf = unsafeTo64bitLE(value);
      expect(buf).toHaveLength(8);
      const back = unsafeFrom64bitLE(buf);
      expect(back).toBe(value);
    });

    it("should throw for numbers greater than MAX_SAFE_INT", () => {
      const above = Number.MAX_SAFE_INTEGER + 1;
      expect(() => unsafeTo64bitLE(above)).toThrow("Can't convert numbers > MAX_SAFE_INT");
    });
  });

  describe("unsafeFrom64bitLE", () => {
    it("should throw if buffer length is not 8", () => {
      expect(() => unsafeFrom64bitLE(Buffer.alloc(4))).toThrow("Expected Buffer of length 8");
    });

    it("should throw if highest byte is non-zero", () => {
      const buf = Buffer.alloc(8, 0);
      buf[7] = 1;
      expect(() => unsafeFrom64bitLE(buf)).toThrow("Can't encode numbers > MAX_SAFE_INT");
    });

    it("should throw if second-highest byte exceeds 0x1f", () => {
      const buf = Buffer.alloc(8, 0);
      buf[6] = 0x20;
      expect(() => unsafeFrom64bitLE(buf)).toThrow("Can't encode numbers > MAX_SAFE_INT");
    });
  });

  describe("BufferReader", () => {
    it("should throw when readSlice goes out of bounds", () => {
      const reader = new BufferReader(Buffer.alloc(2));
      reader.readSlice(2);
      expect(() => reader.readSlice(1)).toThrow("Cannot read slice out of bounds");
    });

    it("should read and write vectors correctly with BufferWriter", () => {
      const writer = new BufferWriter();
      const elements = [Buffer.from("aa", "hex"), Buffer.from("bbbb", "hex")];

      writer.writeVarInt(elements.length);
      for (const el of elements) {
        writer.writeVarSlice(el);
      }

      const buf = writer.buffer();
      const reader = new BufferReader(buf);
      const vector = reader.readVector();

      expect(vector).toHaveLength(elements.length);
      expect(vector[0]).toEqual(elements[0]);
      expect(vector[1]).toEqual(elements[1]);
    });

    it("should support basic integer and slice read/write helpers", () => {
      const writer = new BufferWriter();

      writer.writeUInt8(0x12);
      writer.writeInt32(-42);
      writer.writeUInt32(0xdeadbeef);
      writer.writeUInt64(123456789);
      writer.writeVarInt(3);
      writer.writeSlice(Buffer.from("abcd", "hex"));
      writer.writeVarSlice(Buffer.from("ef", "hex"));

      const buf = writer.buffer();
      const reader = new BufferReader(buf);

      expect(reader.readUInt8()).toBe(0x12);
      expect(reader.readInt32()).toBe(-42);
      expect(reader.readUInt32()).toBe(0xdeadbeef);
      expect(reader.readUInt64()).toBe(123456789);

      const vi = reader.readVarInt();
      expect(vi).toBe(3);

      const slice = reader.readSlice(2);
      expect(slice.toString("hex")).toBe("abcd");

      const varSlice = reader.readVarSlice();
      expect(varSlice.toString("hex")).toBe("ef");
    });
  });

  // Copied from the old test suite
  function run(n: number, expectedHex: string) {
    const w = new BufferWriter();
    w.writeUInt64(n);
    expect(w.buffer()).toEqual(Buffer.from(expectedHex, "hex"));
    const r = new BufferReader(w.buffer());
    expect(r.readUInt64()).toEqual(n);
  }

  test("Test 64 bit numbers", () => {
    run(0, "0000000000000000");
    run(1, "0100000000000000");
    run(0xffffffff, "ffffffff00000000");
    run(0x0100000000, "0000000001000000");
    run(0x010203040506, "0605040302010000");
    run(Number.MAX_SAFE_INTEGER, "FFFFFFFFFFFF1F00");
  });

  test("Too big 64 bit number", () => {
    const w = new BufferWriter();
    expect(() => w.writeUInt64(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    const r = new BufferReader(Buffer.from("FFFFFFFFFFFF2000", "hex"));
    expect(() => r.readUInt64()).toThrow();
  });
});
