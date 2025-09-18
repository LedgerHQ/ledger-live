import { NobleCryptoSecp256k1 } from "../../NobleCrypto";

describe("NobleCryptoSecp256k1", () => {
  const crypto = new NobleCryptoSecp256k1();

  describe("derEncode", () => {
    it("should encode a valid DER signature", () => {
      // The R component starts with a byte < 0x80
      // The S component starts with a 0 but the next byte is >= 0x80
      const der32 = crypto.derEncode(
        Uint8Array.from([
          ...Buffer.from("4802f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891", "hex"),
          ...Buffer.from("008022731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809", "hex"),
        ]),
      );
      expect(Buffer.from(der32).toString("hex")).toBe(noWS` 
        30 44
        02 20 4802f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891
        02 20 008022731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809
      `);

      // The R and S component both start with a byte >= 0x80
      const der33 = crypto.derEncode(
        Uint8Array.from([
          ...Buffer.from("8002f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891", "hex"),
          ...Buffer.from("ff7222731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809", "hex"),
        ]),
      );
      expect(Buffer.from(der33).toString("hex")).toBe(noWS` 
        30 46
        02 21 008002f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891
        02 21 00ff7222731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809
      `);

      // The R and S component both start with a 0 then have a byte < 0x80
      const der31 = crypto.derEncode(
        Uint8Array.from([
          ...Buffer.from("0002f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891", "hex"),
          ...Buffer.from("007222731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809", "hex"),
        ]),
      );
      expect(Buffer.from(der31).toString("hex")).toBe(noWS` 
        30 42
        02 1f 02f9f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891
        02 1f 7222731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809
      `);

      // The R and S component both start several leading 0s
      const derLeadingZeros = crypto.derEncode(
        Uint8Array.from([
          ...Buffer.from("000000f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891", "hex"),
          ...Buffer.from("000000731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809", "hex"),
        ]),
      );
      expect(Buffer.from(derLeadingZeros).toString("hex")).toBe(noWS` 
        30 3f
        02 1e 00f997e06b7e98ec35ba75a10a0e0a5bd1a15767d7d1124869301081d891
        02 1d 731cd6cd05ac285829d8d588b51bb4c5be5bad5a44cbd966fcf670f809
      `);
    });

    it("should throw if a component is null", () => {
      expect(() => crypto.derEncode(Uint8Array.from({ length: 64 }, () => 0))).toThrow(
        `Invalid DER component: 0000000000000000000000000000000000000000000000000000000000000000`,
      );
    });
  });
});

function noWS(...str: TemplateStringsArray[]) {
  return str.join("").replace(/\s+/g, "");
}
