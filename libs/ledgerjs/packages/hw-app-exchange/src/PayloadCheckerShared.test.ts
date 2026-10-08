import { secp256k1 } from "@noble/curves/secp256k1";
import { apduSizeIssues, runPayloadCheck, scanLengthDelimitedField } from "./PayloadCheckerShared";

describe("runPayloadCheck", () => {
  const partnerPublicKey = {
    curve: "secp256k1" as const,
    data: Uint8Array.from(secp256k1.getPublicKey(Buffer.alloc(32, 0x11), false)),
  };

  it("reports PROTOBUF_DECODE_FAILED instead of throwing when the field checks throw", () => {
    const run = () =>
      runPayloadCheck({
        bytes: Uint8Array.from([0x0a, 0x00]),
        encodingIssue: { code: "INVALID_ENCODING", severity: "error", message: "unused" },
        messageName: "NewSellResponse",
        decode: () => ({}),
        inspect: () => {
          throw new RangeError("Invalid string length");
        },
        partnerPublicKey,
        checkSignature: () => [],
      });

    expect(run).not.toThrow();
    const report = run();
    expect(report.valid).toBe(false);
    expect(report.decoded).toBeUndefined();
    expect(report.issues).toEqual([
      expect.objectContaining({ code: "PROTOBUF_DECODE_FAILED", severity: "error" }),
    ]);
  });
});

describe("apduSizeIssues", () => {
  it.each([
    ["ng", 497, []],
    ["ng", 498, ["PAYLOAD_NEAR_SIZE_LIMIT"]],
    ["ng", 504, ["PAYLOAD_NEAR_SIZE_LIMIT"]],
    ["ng", 505, ["PAYLOAD_TOO_LARGE"]],
    ["legacy", 245, []],
    ["legacy", 246, ["PAYLOAD_NEAR_SIZE_LIMIT"]],
    ["legacy", 252, ["PAYLOAD_NEAR_SIZE_LIMIT"]],
    ["legacy", 253, ["PAYLOAD_TOO_LARGE"]],
  ] as const)("%s payload of %d bytes -> %j", (format, bytes, codes) => {
    expect(apduSizeIssues(format, bytes).map(({ code }) => code)).toEqual(codes);
  });

  it("tells how long a fee can be for a payload near the limit", () => {
    // 3 + 500 + 1 + fee <= 509
    expect(apduSizeIssues("ng", 500)[0].message).toContain("a fee longer than 5 bytes");
  });
});

const field13 = (content: number[]) => [0x6a, content.length, ...content];

describe("scanLengthDelimitedField", () => {
  it("returns every occurrence in wire order, skipping the other wire types", () => {
    const varintField1 = [0x08, 0x96, 0x01];
    const fixed64Field2 = [0x11, ...new Array(8).fill(0)];
    const fixed32Field3 = [0x1d, 0, 0, 0, 0];
    const bytesField1 = [0x0a, 0x01, 0xff];
    const bytes = Uint8Array.from([
      ...varintField1,
      ...field13([0x01, 0x02]),
      ...fixed64Field2,
      ...fixed32Field3,
      ...bytesField1,
      ...field13([0x03]),
    ]);

    expect(scanLengthDelimitedField(bytes, 13)?.map(value => Array.from(value))).toEqual([
      [0x01, 0x02],
      [0x03],
    ]);
  });

  it("accepts other fields of any non-group wire type", () => {
    expect(scanLengthDelimitedField(Uint8Array.from([0x78, 0x01, 0x6a, 0x00]), 13)).toEqual([
      new Uint8Array(),
    ]);
  });

  it("returns an empty list when the field is absent", () => {
    expect(scanLengthDelimitedField(Uint8Array.from([0x0a, 0x01, 0x41]), 13)).toEqual([]);
  });

  it.each([
    ["a truncated tag", [0x80]],
    ["a truncated varint value", [0x08, 0x80]],
    ["a length past the end", [0x6a, 0x05, 0x01]],
    ["a truncated 64-bit value", [0x11, 0x00]],
    ["a group wire type", [0x6b, 0x00]],
    ["a group of another field", [0x0a, 0x00, 0x7b, 0x7c, ...field13([0x01])]],
    ["the field as a varint", [0x68, 0x01]],
    ["the field as a 32-bit value", [0x6d, 0x00, 0x00, 0x00, 0x00]],
    ["the field as a varint after a valid occurrence", [...field13([0x01]), 0x68, 0x01]],
    ["a truncated length", [0x6a, 0x80]],
    ["a varint longer than 10 bytes", new Array(11).fill(0x80)],
  ])("returns undefined without throwing for %s", (_case, bytes) => {
    expect(() => scanLengthDelimitedField(Uint8Array.from(bytes), 13)).not.toThrow();
    expect(scanLengthDelimitedField(Uint8Array.from(bytes), 13)).toBeUndefined();
  });
});
