import { SCRIPT_CONSTANTS, detectScriptType, extractHashFromScriptPubKey } from "./scriptDetection";

function makeP2wpkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2WPKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[1];
  buf.fill(1, 2);
  return buf;
}

function makeP2trScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2TR.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2TR.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2TR.PREFIX[1];
  buf.fill(2, 2);
  return buf;
}

function makeP2shScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2SH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2SH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2SH.PREFIX[1];
  buf.fill(3, 2, buf.length - 1);
  buf[buf.length - 1] = SCRIPT_CONSTANTS.P2SH.SUFFIX[0];
  return buf;
}

function makeP2pkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2PKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2PKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2PKH.PREFIX[1];
  buf[2] = SCRIPT_CONSTANTS.P2PKH.PREFIX[2];
  buf.fill(4, 3, 23);
  buf[23] = SCRIPT_CONSTANTS.P2PKH.SUFFIX[0];
  buf[24] = SCRIPT_CONSTANTS.P2PKH.SUFFIX[1];
  return buf;
}

describe("scriptDetection", () => {
  describe("SCRIPT_CONSTANTS", () => {
    it("exposes correct lengths and prefixes for all script types", () => {
      expect(SCRIPT_CONSTANTS.P2WPKH.LENGTH).toBe(22);
      expect(SCRIPT_CONSTANTS.P2WPKH.PREFIX).toEqual([0x00, 0x14]);
      expect(SCRIPT_CONSTANTS.P2TR.LENGTH).toBe(34);
      expect(SCRIPT_CONSTANTS.P2TR.PREFIX).toEqual([0x51, 0x20]);
      expect(SCRIPT_CONSTANTS.P2SH.LENGTH).toBe(23);
      expect(SCRIPT_CONSTANTS.P2SH.PREFIX).toEqual([0xa9, 0x14]);
      expect(SCRIPT_CONSTANTS.P2SH.SUFFIX).toEqual([0x87]);
      expect(SCRIPT_CONSTANTS.P2PKH.LENGTH).toBe(25);
      expect(SCRIPT_CONSTANTS.P2PKH.PREFIX).toEqual([0x76, 0xa9, 0x14]);
      expect(SCRIPT_CONSTANTS.P2PKH.SUFFIX).toEqual([0x88, 0xac]);
    });
  });

  describe("detectScriptType", () => {
    it("returns p2wpkh for valid P2WPKH scriptPubKey", () => {
      expect(detectScriptType(makeP2wpkhScriptPubKey())).toBe("p2wpkh");
    });

    it("returns p2tr for valid P2TR scriptPubKey", () => {
      expect(detectScriptType(makeP2trScriptPubKey())).toBe("p2tr");
    });

    it("returns p2sh for valid P2SH scriptPubKey", () => {
      expect(detectScriptType(makeP2shScriptPubKey())).toBe("p2sh");
    });

    it("returns p2pkh for valid P2PKH scriptPubKey", () => {
      expect(detectScriptType(makeP2pkhScriptPubKey())).toBe("p2pkh");
    });

    it("returns undefined for wrong length", () => {
      expect(detectScriptType(Buffer.from([0x00, 0x14, 0x00]))).toBeUndefined();
    });

    it("returns undefined for wrong prefix", () => {
      const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2TR.LENGTH);
      buf[0] = SCRIPT_CONSTANTS.P2TR.PREFIX[0];
      buf[1] = SCRIPT_CONSTANTS.P2TR.PREFIX[1];
      expect(detectScriptType(buf)).toBe("p2tr");
      buf[0] = 0xff;
      expect(detectScriptType(buf)).toBeUndefined();
    });

    it("returns undefined for 23-byte script with P2SH prefix but wrong push opcode", () => {
      const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2SH.LENGTH);
      buf[0] = 0xa9; // OP_HASH160
      buf[1] = 0xff; // wrong push opcode (should be 0x14)
      buf.fill(0x00, 2, buf.length - 1);
      buf[buf.length - 1] = 0x87; // OP_EQUAL
      expect(detectScriptType(buf)).toBeUndefined();
    });

    it("returns undefined for 25-byte script with P2PKH prefix but non-standard template", () => {
      const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2PKH.LENGTH);
      buf[0] = 0x76; // OP_DUP
      buf[1] = 0xa9; // OP_HASH160
      buf[2] = 0xff; // wrong push opcode (should be 0x14)
      buf.fill(0x00, 3, 23);
      buf[23] = 0x88; // OP_EQUALVERIFY
      buf[24] = 0xac; // OP_CHECKSIG
      expect(detectScriptType(buf)).toBeUndefined();

      const buf2 = Buffer.alloc(SCRIPT_CONSTANTS.P2PKH.LENGTH);
      buf2[0] = 0x76;
      buf2[1] = 0xa9;
      buf2[2] = 0x14;
      buf2.fill(0x00, 3, 23);
      buf2[23] = 0x00; // wrong suffix
      buf2[24] = 0x00;
      expect(detectScriptType(buf2)).toBeUndefined();
    });

    it("returns undefined for unknown script", () => {
      expect(detectScriptType(Buffer.from([0x6a, 0x00]))).toBeUndefined();
    });
  });

  describe("extractHashFromScriptPubKey", () => {
    it("extracts hash and scriptType for p2wpkh scriptPubKey", () => {
      const script = makeP2wpkhScriptPubKey();
      const hash = Buffer.alloc(20, 1);
      script.set(hash, 2);
      const result = extractHashFromScriptPubKey(script);
      expect(result).toEqual({ hashHex: hash.toString("hex"), scriptType: "p2wpkh" });
    });

    it("extracts hash and scriptType for p2tr scriptPubKey", () => {
      const script = makeP2trScriptPubKey();
      const tweak = Buffer.alloc(32, 0xab);
      script.set(tweak, 2);
      const result = extractHashFromScriptPubKey(script);
      expect(result).toEqual({ hashHex: tweak.toString("hex"), scriptType: "p2tr" });
    });

    it("extracts hash and scriptType for p2sh scriptPubKey", () => {
      const script = makeP2shScriptPubKey();
      const hash = Buffer.alloc(20, 3);
      script.set(hash, 2);
      const result = extractHashFromScriptPubKey(script);
      expect(result).toEqual({ hashHex: hash.toString("hex"), scriptType: "p2sh" });
    });

    it("extracts hash and scriptType for p2pkh scriptPubKey", () => {
      const script = makeP2pkhScriptPubKey();
      const hash = Buffer.alloc(20, 2);
      script.set(hash, 3);
      const result = extractHashFromScriptPubKey(script);
      expect(result).toEqual({ hashHex: hash.toString("hex"), scriptType: "p2pkh" });
    });

    it("returns undefined for unsupported script", () => {
      expect(extractHashFromScriptPubKey(Buffer.from([0x00]))).toBeUndefined();
    });
  });
});
