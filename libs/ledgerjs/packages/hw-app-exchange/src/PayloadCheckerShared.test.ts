import { secp256k1 } from "@noble/curves/secp256k1";
import {
  apduSizeIssues,
  runPayloadCheck,
  scanWireFields,
  type WireField,
} from "./PayloadCheckerShared";

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
        wireFields: [],
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

const NAME: WireField = { fieldNumber: 1, protoName: "name", kind: "string", maxSize: 4 };
const DATA: WireField = { fieldNumber: 13, protoName: "data", kind: "bytes", maxSize: 3 };
const AMOUNT: WireField = {
  fieldNumber: 6,
  protoName: "amount",
  kind: "message",
  fields: [
    { fieldNumber: 1, protoName: "amount.coefficient", kind: "bytes", maxSize: 2 },
    { fieldNumber: 2, protoName: "amount.exponent", kind: "varint" },
  ],
};
const FIELDS = [NAME, DATA, AMOUNT];

const lengthDelimited = (fieldNumber: number, content: number[]) => [
  (fieldNumber << 3) | 2,
  content.length,
  ...content,
];
const field13 = (content: number[]) => lengthDelimited(13, content);

const scan = (bytes: number[]) => scanWireFields(Uint8Array.from(bytes), FIELDS);

describe("scanWireFields", () => {
  it("returns every occurrence in wire order, skipping unknown fields of any non-group wire type", () => {
    const varintField2 = [0x10, 0x96, 0x01];
    const fixed64Field3 = [0x19, ...new Array(8).fill(0)];
    const fixed32Field4 = [0x25, 0, 0, 0, 0];
    const bytesField5 = [0x2a, 0x01, 0xff];

    const wire = scan([
      ...varintField2,
      ...field13([0x01, 0x02]),
      ...fixed64Field3,
      ...fixed32Field4,
      ...bytesField5,
      ...field13([0x03]),
    ]);

    expect(wire?.occurrences.get(DATA)?.map(value => Array.from(value))).toEqual([
      [0x01, 0x02],
      [0x03],
    ]);
    expect(wire?.violations).toEqual([]);
  });

  it("returns no occurrence for an absent field", () => {
    expect(scan(lengthDelimited(1, [0x41]))?.occurrences.has(DATA)).toBe(false);
  });

  it("applies the string NUL terminator rule and the full bytes size", () => {
    expect(scan([...lengthDelimited(1, [1, 2, 3]), ...field13([1, 2, 3])])?.violations).toEqual([]);
    expect(
      scan([...lengthDelimited(1, [1, 2, 3, 4]), ...field13([1, 2, 3, 4])])?.violations,
    ).toEqual([
      { field: "name", limit: 3, actual: 4 },
      { field: "data", limit: 3, actual: 4 },
    ]);
  });

  it("reports an oversized occurrence once even when a later duplicate fits", () => {
    expect(
      scan([...field13([1, 2, 3, 4, 5]), ...field13([1, 2, 3, 4]), ...field13([1])])?.violations,
    ).toEqual([{ field: "data", limit: 3, actual: 5 }]);
  });

  it("checks every occurrence of a field of an embedded message", () => {
    const amount = (coefficient: number[]) =>
      lengthDelimited(6, [...lengthDelimited(1, coefficient), 0x10, 0x02]);

    expect(scan([...amount([1, 2, 3]), ...amount([1])])?.violations).toEqual([
      { field: "amount.coefficient", limit: 2, actual: 3 },
    ]);
  });

  it("reports violations in the order of the fields, not of the wire", () => {
    expect(
      scan([...field13([1, 2, 3, 4]), ...lengthDelimited(1, [1, 2, 3, 4])])?.violations.map(
        ({ field }) => field,
      ),
    ).toEqual(["name", "data"]);
  });

  it.each([
    ["a truncated tag", [0x80]],
    ["field number 0", [0x00, 0x01]],
    ["a tag above 32 bits", [0x80, 0x80, 0x80, 0x80, 0x10, 0x00]],
    ["a truncated varint value", [0x10, 0x80]],
    ["a length past the end", [0x6a, 0x05, 0x01]],
    ["a truncated length", [0x6a, 0x80]],
    ["a truncated 64-bit value", [0x19, 0x00]],
    ["a truncated 32-bit value", [0x25, 0x00]],
    ["a start group wire type", [0x6b, 0x00]],
    ["an end group wire type", [0x7c]],
    ["a group of an unknown field", [...lengthDelimited(1, []), 0x7b, 0x7c, ...field13([0x01])]],
    ["an invalid wire type", [0x7e]],
    ["a string field as a varint", [0x08, 0x01]],
    ["a bytes field as a 32-bit value", [0x6d, 0x00, 0x00, 0x00, 0x00]],
    ["a bytes field as a varint after a valid occurrence", [...field13([0x01]), 0x68, 0x01]],
    ["a message field as a varint", [0x30, 0x01]],
    ["a varint field of a message as length-delimited", lengthDelimited(6, [0x12, 0x00])],
    ["a group inside a message", lengthDelimited(6, [0x7b, 0x7c])],
    ["a truncated field inside a message", lengthDelimited(6, [0x0a, 0x05])],
    ["a varint longer than 10 bytes", new Array(11).fill(0x80)],
  ])("returns undefined without throwing for %s", (_case, bytes) => {
    expect(() => scan(bytes)).not.toThrow();
    expect(scan(bytes)).toBeUndefined();
  });
});
