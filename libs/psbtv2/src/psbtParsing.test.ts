import { normalizeToBuffer, parsePsbt } from "./psbtParsing";

describe("psbtParsing helpers", () => {
  describe("normalizeToBuffer", () => {
    it("returns null for empty or falsy input", () => {
      // @ts-expect-error testing runtime behaviour with undefined
      expect(normalizeToBuffer(undefined)).toBeNull();
      // @ts-expect-error testing runtime behaviour with null
      expect(normalizeToBuffer(null)).toBeNull();
      const spaceBuf = normalizeToBuffer("   ");
      expect(spaceBuf).not.toBeNull();
      expect(spaceBuf!.length).toBe(0);
    });

    it("decodes hex strings", () => {
      const buf = normalizeToBuffer("48656c6c6f"); // "Hello"
      expect(buf).not.toBeNull();
      expect(buf!.toString("utf8")).toBe("Hello");
    });

    it("decodes base64 strings with whitespace and URL-safe alphabet", () => {
      const original = Buffer.from("hello world");
      const urlSafe = original.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
      const spaced = `  ${urlSafe.slice(0, 4)} \n ${urlSafe.slice(4)}  `;

      const buf = normalizeToBuffer(spaced);
      expect(buf).not.toBeNull();
      expect(buf!.toString("utf8")).toBe("hello world");
    });

    it("produces a buffer even for non-PSBT garbage", () => {
      const buf = normalizeToBuffer("not base64!!!");
      expect(buf).not.toBeNull();
      expect(Buffer.isBuffer(buf)).toBe(true);
    });
  });

  describe("parsePsbt", () => {
    it("returns a Buffer for a valid base64 PSBT", () => {
      // Minimal valid PSBTv0-like structure: magic bytes + 0x00 (end of global map)
      // then 0x00 (no inputs) and 0x00 (no outputs).
      const minimalPsbt = Buffer.concat([
        Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]),
        Buffer.from([0x00, 0x00, 0x00]),
      ]);

      const b64 = minimalPsbt.toString("base64");
      const parsed = parsePsbt(b64);

      expect(Buffer.isBuffer(parsed)).toBe(true);
      expect(parsed.equals(minimalPsbt)).toBe(true);
    });

    it("throws specific error for missing/empty input", () => {
      expect(() => parsePsbt("")).toThrow("Invalid PSBT: not valid base64");
    });

    it("throws specific error for whitespace-only input (empty buffer)", () => {
      expect(() => parsePsbt("   ")).toThrow("Invalid PSBT: empty buffer");
    });

    it("propagates base64 decoder failures via normalizeToBuffer", () => {
      const originalFrom = Buffer.from;

      // Force Buffer.from to throw for a specific base64 case so that
      // normalizeToBuffer's catch branch is exercised.
      const patchedFrom = (value: string | ArrayBufferView, encoding?: BufferEncoding): Buffer => {
        if (encoding === "base64" && typeof value === "string" && value.includes("causeError")) {
          throw new Error("base64 decode failure");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/consistent-type-assertions
        return originalFrom(value as any, encoding as any);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/consistent-type-assertions
      (Buffer as any).from = patchedFrom as any;

      try {
        expect(() => parsePsbt("causeError")).toThrow("Invalid PSBT: not valid base64");
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/consistent-type-assertions
        (Buffer as any).from = originalFrom as any;
      }
    });
  });
});
