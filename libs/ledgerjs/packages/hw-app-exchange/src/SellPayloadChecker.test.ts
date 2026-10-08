import { createHash } from "node:crypto";
import { secp256k1 } from "@noble/curves/secp256k1";
import { p256 } from "@noble/curves/nist";
import { ledger_trade } from "./generate-protocol";
import {
  checkSellPayload,
  type SellPayloadCheckInput,
  type SellPayloadCheckReport,
} from "./SellPayloadChecker";
import type { SwapPayloadIssueCode } from "./SwapPayloadChecker";

type CurveName = "secp256k1" | "secp256r1";
type NobleCurve = typeof secp256k1 | typeof p256;

const CURVES: Record<CurveName, NobleCurve> = { secp256k1, secp256r1: p256 };

// Deterministic (RFC6979) test keys, never used outside of these fixtures.
const PARTNER_PRIVATE_KEY = Uint8Array.from(Buffer.from("11".repeat(32), "hex"));
const OTHER_PRIVATE_KEY = Uint8Array.from(Buffer.from("22".repeat(32), "hex"));

const NONCE = Buffer.from("c0ffee".repeat(10) + "beef", "hex");
const NONCE_HEX = NONCE.toString("hex");

const VALID_FIELDS: ledger_trade.INewSellResponse = {
  traderEmail: "trader@example.com",
  inCurrency: "BTC",
  inAmount: Buffer.from("0186a0", "hex"),
  inAddress: "bc1qtestinaddress00000000000000000000000",
  outCurrency: "EUR",
  outAmount: { coefficient: Buffer.from("20f6", "hex"), exponent: 2 },
  deviceTransactionId: NONCE,
};

const sha256 = (message: Uint8Array): Uint8Array =>
  Uint8Array.from(createHash("sha256").update(message).digest());

const base64url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const encodeFields = (fields: ledger_trade.INewSellResponse) => {
  const message = ledger_trade.NewSellResponse.create(fields);
  const raw = ledger_trade.NewSellResponse.encode(message).finish();
  return { raw, payload: base64url(raw) };
};

// `prehash: false` because we hash ourselves, like the device does with SHA-256.
const signCompact = (
  curveName: CurveName,
  message: Uint8Array,
  privateKey: Uint8Array = PARTNER_PRIVATE_KEY,
): Uint8Array =>
  CURVES[curveName]
    .sign(sha256(message), privateKey, { lowS: false, prehash: false })
    .toBytes("compact");

const publicKeyFor = (curveName: CurveName, privateKey: Uint8Array = PARTNER_PRIVATE_KEY) => ({
  curve: curveName,
  data: Uint8Array.from(CURVES[curveName].getPublicKey(privateKey, false)),
});

const dotPrefixed = (payload: string): Uint8Array => Buffer.from("." + payload, "utf8");

type SignedOver = "dot-prefixed" | "no-dot" | "raw-protobuf";

const buildInput = ({
  fields = VALID_FIELDS,
  curve = "secp256k1",
  signedOver = "dot-prefixed",
  expected,
}: {
  fields?: ledger_trade.INewSellResponse;
  curve?: CurveName;
  signedOver?: SignedOver;
  expected?: SellPayloadCheckInput["expected"];
} = {}): SellPayloadCheckInput => {
  const { raw, payload } = encodeFields(fields);
  const signedBytes = {
    "dot-prefixed": dotPrefixed(payload),
    "no-dot": Buffer.from(payload, "utf8"),
    "raw-protobuf": raw,
  }[signedOver];

  return {
    payload,
    signature: base64url(signCompact(curve, signedBytes)),
    partnerPublicKey: publicKeyFor(curve),
    ...(expected ? { expected } : {}),
  };
};

const lengthDelimited = (fieldNumber: number, content: Uint8Array): Buffer => {
  const length = content.length;
  const lengthBytes = length < 128 ? [length] : [(length & 0x7f) | 0x80, length >> 7];
  return Buffer.concat([Buffer.from([(fieldNumber << 3) | 2, ...lengthBytes]), content]);
};

const codesOf = (report: SellPayloadCheckReport): SwapPayloadIssueCode[] =>
  report.issues.map(issue => issue.code);

const errorCodesOf = (report: SellPayloadCheckReport): SwapPayloadIssueCode[] =>
  report.issues.filter(issue => issue.severity === "error").map(issue => issue.code);

const SIGNATURE_ERROR_CODES: SwapPayloadIssueCode[] = [
  "SIGNATURE_MALFORMED",
  "SIGNATURE_WITHOUT_DOT_PREFIX",
  "SIGNATURE_OVER_RAW_PROTOBUF",
  "SIGNATURE_INVALID",
];

describe("checkSellPayload", () => {
  describe("valid payloads", () => {
    it.each(["secp256k1", "secp256r1"] as const)(
      "accepts a valid %s payload and returns the normalized decoded fields",
      curve => {
        const report = checkSellPayload(buildInput({ curve }));

        expect(report.valid).toBe(true);
        expect(report.issues).toEqual([]);
        expect(report.decoded).toEqual({
          traderEmail: "trader@example.com",
          inCurrency: "BTC",
          inAmount: 100_000n,
          inAddress: VALID_FIELDS.inAddress,
          outCurrency: "EUR",
          outAmount: "84.38",
          deviceTransactionId: NONCE_HEX,
        });
      },
    );

    it("decodes the optional in_extra_id", () => {
      const report = checkSellPayload(
        buildInput({ fields: { ...VALID_FIELDS, inExtraId: "memo-42" } }),
      );

      expect(report.valid).toBe(true);
      expect(report.decoded?.inExtraId).toBe("memo-42");
    });

    it.each([
      ["coefficient 0x20f6, exponent 2", "20f6", 2, "84.38"],
      ["no exponent", "20f6", 0, "8438"],
      ["trailing zeros", "2710", 2, "100"],
      ["a value below 1", "05", 3, "0.005"],
    ])("formats out_amount with %s", (_case, coefficientHex, exponent, outAmount) => {
      const report = checkSellPayload(
        buildInput({
          fields: {
            ...VALID_FIELDS,
            outAmount: { coefficient: Buffer.from(coefficientHex, "hex"), exponent },
          },
        }),
      );

      expect(report.decoded?.outAmount).toBe(outAmount);
    });

    it("accepts an out_amount exponent of 38", () => {
      const report = checkSellPayload(
        buildInput({
          fields: {
            ...VALID_FIELDS,
            outAmount: { coefficient: Buffer.from("05", "hex"), exponent: 38 },
          },
        }),
      );

      expect(report.valid).toBe(true);
      expect(report.decoded?.outAmount).toBe(`0.${"0".repeat(37)}5`);
    });
  });

  describe("out_amount exponent", () => {
    const withOutAmount = (exponent: number, outCurrency = "EUR", coefficientHex = "20f6") =>
      checkSellPayload(
        buildInput({
          fields: {
            ...VALID_FIELDS,
            outCurrency,
            outAmount: { coefficient: Buffer.from(coefficientHex, "hex"), exponent },
          },
        }),
      );

    // The device formats "<out_currency> <amount>" in a 50-byte buffer: "EUR " leaves 46 bytes,
    // "0." + 43 digits + the null terminator fills them.
    it.each([
      ["EUR", 43],
      ["ABCDEFGHI", 37],
      ["XY", 44],
    ])("accepts the largest exponent the device can display with %s (%d)", (outCurrency, max) => {
      const report = withOutAmount(max, outCurrency, "05");

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
      expect(report.decoded?.outAmount).toBe(`0.${"0".repeat(max - 1)}5`);
    });

    it.each([
      ["EUR", 44],
      ["ABCDEFGHI", 38],
      ["XY", 45],
    ])(
      "reports FIELD_EXCEEDS_LIMIT for an exponent above it with %s (%d)",
      (outCurrency, exponent) => {
        const report = withOutAmount(exponent, outCurrency, "05");

        expect(report.valid).toBe(false);
        expect(report.issues).toEqual([
          expect.objectContaining({
            code: "FIELD_EXCEEDS_LIMIT",
            severity: "error",
            field: "out_amount.exponent",
            message: expect.stringContaining(`at most ${exponent - 1} decimals`),
          }),
        ]);
      },
    );

    it("accepts an exponent of 39, which the device can display", () => {
      const report = withOutAmount(39);

      expect(report.valid).toBe(true);
      expect(report.decoded?.outAmount).toBe(`0.${"0".repeat(35)}8438`);
    });

    it.each([
      [255, `0.${"0".repeat(251)}8438`],
      [256, "8438e-256"],
      [1_000_000, "8438e-1000000"],
      [4_294_967_295, "8438e-4294967295"],
    ])("reports FIELD_EXCEEDS_LIMIT without throwing for exponent %d", (exponent, outAmount) => {
      let report: SellPayloadCheckReport | undefined;
      expect(() => {
        report = withOutAmount(exponent);
      }).not.toThrow();

      expect(report?.valid).toBe(false);
      expect(report?.issues).toEqual([
        expect.objectContaining({
          code: "FIELD_EXCEEDS_LIMIT",
          severity: "error",
          field: "out_amount.exponent",
        }),
      ]);
      expect(report?.decoded?.outAmount).toBe(outAmount);
    });
  });

  describe("out_amount coefficient", () => {
    const withCoefficient = (coefficient: Buffer) =>
      checkSellPayload(
        buildInput({ fields: { ...VALID_FIELDS, outAmount: { coefficient, exponent: 2 } } }),
      );

    it("reports FIELD_EXCEEDS_LIMIT for a 9-byte coefficient, which does not fit in 64 bits", () => {
      const report = withCoefficient(Buffer.alloc(9, 0x01));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "FIELD_EXCEEDS_LIMIT",
          severity: "error",
          field: "out_amount.coefficient",
          message: expect.stringContaining("64 bits"),
        }),
      ]);
    });

    it.each([
      ["8 bytes", Buffer.alloc(8, 0xff), 18_446_744_073_709_551_615n],
      [
        "9 bytes with a leading 0x00",
        Buffer.concat([Buffer.alloc(1), Buffer.alloc(8, 0xff)]),
        18_446_744_073_709_551_615n,
      ],
      [
        "16 bytes zero-padded to 8 significant bytes",
        Buffer.concat([Buffer.alloc(8), Buffer.from("00000000000020f6", "hex")]),
        8438n,
      ],
    ])("accepts a coefficient of %s, trimmed like the device", (_case, coefficient, value) => {
      const report = withCoefficient(coefficient);

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
      const digits = value.toString();
      expect(report.decoded?.outAmount).toBe(`${digits.slice(0, -2)}.${digits.slice(-2)}`);
    });

    it("reports only the protobuf size limit for a 17-byte coefficient", () => {
      const report = withCoefficient(Buffer.alloc(17, 0x01));

      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "FIELD_EXCEEDS_LIMIT",
          field: "out_amount.coefficient",
          message: expect.stringMatching(/\b16\b.*\b17\b|\b17\b.*\b16\b/),
        }),
      ]);
    });
  });

  describe("leading dot", () => {
    // Ledger Live sends "." + payload, so a payload that already has the dot reaches the device
    // as ".." + payload and is rejected.
    it("reports PAYLOAD_LEADING_DOT for a payload given in JWS form and still decodes it", () => {
      const input = buildInput();

      const report = checkSellPayload({ ...input, payload: "." + input.payload });

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_LEADING_DOT", severity: "error" }),
      ]);
      expect(report.decoded?.outAmount).toBe("84.38");
    });

    it("still runs the other checks on the payload without the dot", () => {
      const input = buildInput({
        fields: { ...VALID_FIELDS, outCurrency: "" },
        signedOver: "raw-protobuf",
      });

      const report = checkSellPayload({ ...input, payload: "." + input.payload });

      expect(errorCodesOf(report)).toEqual([
        "PAYLOAD_LEADING_DOT",
        "MISSING_FIELD",
        "SIGNATURE_OVER_RAW_PROTOBUF",
      ]);
    });

    it("reports PAYLOAD_LEADING_DOT and INVALID_ENCODING for a lone dot", () => {
      const report = checkSellPayload({
        payload: ".",
        signature: base64url(signCompact("secp256k1", dotPrefixed("."))),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });

      expect(report.valid).toBe(false);
      expect(codesOf(report)).toEqual(["PAYLOAD_LEADING_DOT", "INVALID_ENCODING"]);
    });
  });

  describe("encoding", () => {
    const { raw, payload } = encodeFields({ ...VALID_FIELDS, inExtraId: "~~~~" });
    const standardBase64 = Buffer.from(raw).toString("base64");

    // Signs "." + payload exactly as given, the bytes the device hashes.
    const signedAsGiven = (givenPayload: string): SellPayloadCheckInput => ({
      payload: givenPayload,
      signature: base64url(signCompact("secp256k1", dotPrefixed(givenPayload))),
      partnerPublicKey: publicKeyFor("secp256k1"),
    });

    // The unpadded base64url length is never 4n+1: 4n+2 needs "==", 4n+3 needs "=".
    const payloadWithPadding = (padding: 1 | 2): string => {
      for (let i = 0; i < 3; i++) {
        const encoded = encodeFields({ ...VALID_FIELDS, inExtraId: "x".repeat(i) }).payload;
        if (encoded.length % 4 === 4 - padding) return encoded + "=".repeat(padding);
      }
      throw new Error("no payload with the requested padding");
    };

    it("uses a fixture whose standard base64 differs from base64url", () => {
      expect(payload).toMatch(/-/);
      expect(payload).toMatch(/_/);
      expect(payload.length % 4).toBe(3);
      expect(standardBase64).toMatch(/\+/);
    });

    // The Exchange app strips up to two trailing "=" and maps "/" like "_".
    it.each([
      ['one "=" of padding', payloadWithPadding(1)],
      ['two "=" of padding', payloadWithPadding(2)],
      ['"/" instead of "_"', payload.replace(/_/g, "/")],
      ['"/" and "=" padding', `${payload.replace(/_/g, "/")}=`],
    ])("accepts a payload with %s signed over it as given", (_case, givenPayload) => {
      const report = checkSellPayload(signedAsGiven(givenPayload));

      expect(report).toEqual({
        valid: true,
        decoded: expect.objectContaining({ inCurrency: "BTC", outAmount: "84.38" }),
        issues: [],
      });
    });

    it('verifies the signature over "." + payload including its padding', () => {
      const padded = payloadWithPadding(2);

      const report = checkSellPayload({
        ...signedAsGiven(padded.replace(/=+$/, "")),
        payload: padded,
      });

      expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
    });

    it.each([
      ["full standard base64", standardBase64],
      ['"+" instead of "-"', payload.replace(/-/g, "+")],
      ['"=" in the middle', `${payload.slice(0, 8)}=${payload.slice(9)}`],
      ['three trailing "="', `${payloadWithPadding(1)}==`],
      ["a length of 4n+1", payload.slice(0, -2)],
      ["a hex payload with a trailing dot", `${Buffer.from(raw).toString("hex")}.`],
      ["an empty payload", ""],
    ])("reports INVALID_ENCODING for %s", (_case, badPayload) => {
      const report = checkSellPayload(signedAsGiven(badPayload));

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "INVALID_ENCODING", severity: "error" }),
      ]);
      expect(report.issues[0].message).toMatch(/4n\+1/);
    });
  });

  it("reports PROTOBUF_DECODE_FAILED for bytes that are not a NewSellResponse", () => {
    const payload = base64url(Uint8Array.from([0x0a, 0xff]));

    const report = checkSellPayload({
      payload,
      signature: base64url(signCompact("secp256k1", dotPrefixed(payload))),
      partnerPublicKey: publicKeyFor("secp256k1"),
    });

    expect(report.valid).toBe(false);
    expect(report.decoded).toBeUndefined();
    expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
    expect(report.issues[0].message).toMatch(/NewSellResponse/);
  });

  describe("raw wire data", () => {
    const checkRaw = (raw: Uint8Array) => {
      const payload = base64url(raw);
      return checkSellPayload({
        payload,
        signature: base64url(signCompact("secp256k1", dotPrefixed(payload))),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });
    };

    const validRaw = encodeFields(VALID_FIELDS).raw;

    // protobufjs decodes these, nanopb fails to decode the message.
    it.each([
      ["an unknown field as a group", [0x7b, 0x7c]],
      ["a group wrapping a field", [0x7b, 0x08, 0x01, 0x7c]],
      ["in_extra_id as a varint", [0x40, 0x00]],
      ["out_amount.exponent as length-delimited", [0x32, 0x05, 0x0a, 0x01, 0x05, 0x12, 0x00]],
      ["a group inside out_amount", [0x32, 0x05, 0x0a, 0x01, 0x05, 0x7b, 0x7c]],
      ["a truncated in_address length", [0x22, 0x05, 0x01]],
    ])("reports PROTOBUF_DECODE_FAILED for %s", (_case, suffix) => {
      const report = checkRaw(Buffer.concat([validRaw, Buffer.from(suffix)]));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
    });

    it("still accepts an unknown varint, 32-bit or 64-bit field", () => {
      const report = checkRaw(
        Buffer.concat([
          validRaw,
          Buffer.from([0x78, 0x01, 0x7d, ...new Array(4).fill(0), 0x79, ...new Array(8).fill(0)]),
        ]),
      );

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it("reports FIELD_EXCEEDS_LIMIT for an oversized field followed by a valid duplicate", () => {
      const report = checkRaw(
        Buffer.concat([lengthDelimited(4, Buffer.alloc(151, 0x61)), validRaw]),
      );

      expect(report.decoded?.inAddress).toBe(VALID_FIELDS.inAddress);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "FIELD_EXCEEDS_LIMIT",
          field: "in_address",
          message: expect.stringMatching(/151 bytes.*at most 150 bytes/),
        }),
      ]);
    });

    const outAmount = (...coefficients: Buffer[]) =>
      lengthDelimited(
        6,
        Buffer.concat([...coefficients.map(c => lengthDelimited(1, c)), Buffer.from([0x10, 0x02])]),
      );

    it.each([
      ["an out_amount", Buffer.concat([outAmount(Buffer.alloc(17, 0x01)), validRaw])],
      [
        "a coefficient in the same out_amount",
        Buffer.concat([validRaw, outAmount(Buffer.alloc(17, 0x01), Buffer.from("20f6", "hex"))]),
      ],
    ])(
      "reports FIELD_EXCEEDS_LIMIT for an oversized coefficient followed by %s that fits",
      (_case, raw) => {
        const report = checkRaw(raw);

        expect(report.decoded?.outAmount).toBe("84.38");
        expect(report.issues).toEqual([
          expect.objectContaining({
            code: "FIELD_EXCEEDS_LIMIT",
            field: "out_amount.coefficient",
            message: expect.stringMatching(/17 bytes.*at most 16 bytes/),
          }),
        ]);
      },
    );
  });

  describe("required fields", () => {
    it.each([
      ["in_currency", "inCurrency"],
      ["in_amount", "inAmount"],
      ["in_address", "inAddress"],
      ["out_currency", "outCurrency"],
      ["out_amount", "outAmount"],
      ["device_transaction_id", "deviceTransactionId"],
    ] as const)("reports MISSING_FIELD when %s is missing", (field, key) => {
      const { [key]: _omitted, ...fields } = VALID_FIELDS;

      const report = checkSellPayload(buildInput({ fields }));

      expect(report.valid).toBe(false);
      expect(report.issues.filter(issue => issue.code === "MISSING_FIELD")).toEqual([
        expect.objectContaining({ code: "MISSING_FIELD", severity: "error", field }),
      ]);
    });

    it("does not require trader_email", () => {
      const { traderEmail: _omitted, ...fields } = VALID_FIELDS;

      const report = checkSellPayload(buildInput({ fields }));

      expect(report.valid).toBe(true);
      expect(report.decoded?.traderEmail).toBeUndefined();
    });

    it("reports MISSING_FIELD when out_amount has no coefficient", () => {
      const report = checkSellPayload(
        buildInput({ fields: { ...VALID_FIELDS, outAmount: { exponent: 2 } } }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ code: "MISSING_FIELD", field: "out_amount" }),
      );
    });

    it.each([
      ["in_amount", { inAmount: Buffer.from([0x00]) }],
      ["out_amount", { outAmount: { coefficient: Buffer.from([0x00, 0x00]), exponent: 2 } }],
    ])("reports ZERO_AMOUNT when %s is 0", (field, override) => {
      const report = checkSellPayload(buildInput({ fields: { ...VALID_FIELDS, ...override } }));

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ code: "ZERO_AMOUNT", severity: "error", field }),
      );
      expect(codesOf(report)).not.toContain("MISSING_FIELD");
    });

    it.each([31, 33])(
      "reports INVALID_DEVICE_TRANSACTION_ID for a %i-byte device_transaction_id",
      length => {
        const report = checkSellPayload(
          buildInput({
            fields: { ...VALID_FIELDS, deviceTransactionId: Buffer.alloc(length, 0xab) },
          }),
        );

        expect(report.valid).toBe(false);
        expect(report.issues).toContainEqual(
          expect.objectContaining({
            code: "INVALID_DEVICE_TRANSACTION_ID",
            severity: "error",
            field: "device_transaction_id",
          }),
        );
      },
    );
  });

  describe("field size limits", () => {
    it.each([
      ["in_address", { inAddress: "a".repeat(151) }, 150, 151],
      ["in_currency", { inCurrency: "A".repeat(10) }, 9, 10],
      ["trader_email", { traderEmail: "a".repeat(50) }, 49, 50],
      ["out_amount.coefficient", { outAmount: { coefficient: Buffer.alloc(17, 1) } }, 16, 17],
    ])("reports FIELD_EXCEEDS_LIMIT for an oversized %s", (field, override, max, actual) => {
      const report = checkSellPayload(buildInput({ fields: { ...VALID_FIELDS, ...override } }));

      expect(report.valid).toBe(false);
      const issue = report.issues.find(({ code }) => code === "FIELD_EXCEEDS_LIMIT");
      expect(issue).toMatchObject({ severity: "error", field });
      expect(issue?.message).toMatch(new RegExp(`\\b${max}\\b`));
      expect(issue?.message).toMatch(new RegExp(`\\b${actual}\\b`));
    });

    it("accepts every field sized exactly at the device usable limit", () => {
      const report = checkSellPayload(
        buildInput({
          fields: {
            ...VALID_FIELDS,
            traderEmail: "a".repeat(49),
            inCurrency: "A".repeat(9),
            inAmount: Buffer.alloc(16, 0xff),
            inAddress: "a".repeat(150),
            inExtraId: "a".repeat(19),
            outCurrency: "A".repeat(9),
            // 16 bytes, zero-padded: the device trims it to the 8 bytes it can display
            outAmount: {
              coefficient: Buffer.concat([Buffer.alloc(8), Buffer.alloc(8, 0xff)]),
              exponent: 2,
            },
          },
        }),
      );

      expect(codesOf(report)).not.toContain("FIELD_EXCEEDS_LIMIT");
      expect(report.valid).toBe(true);
    });
  });

  describe("expected values", () => {
    const matchingExpected = {
      deviceTransactionId: NONCE_HEX,
      inCurrency: "BTC",
      inAmount: 100_000n,
      inAddress: VALID_FIELDS.inAddress ?? "",
      outCurrency: "EUR",
    };

    it("reports no issue when every expected value matches", () => {
      const report = checkSellPayload(buildInput({ expected: matchingExpected }));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each(["0x", "0X"])(
      "compares a %s prefixed deviceTransactionId case-insensitively",
      prefix => {
        const report = checkSellPayload(
          buildInput({ expected: { deviceTransactionId: prefix + NONCE_HEX.toUpperCase() } }),
        );

        expect(report.valid).toBe(true);
        expect(report.issues).toEqual([]);
      },
    );

    it("reports EXPECTED_VALUE_MISMATCH for a different nonce and amount", () => {
      const report = checkSellPayload(
        buildInput({
          expected: {
            ...matchingExpected,
            deviceTransactionId: "0x" + "00".repeat(32),
            inAmount: 100_001n,
          },
        }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "EXPECTED_VALUE_MISMATCH",
          severity: "error",
          field: "device_transaction_id",
        }),
        expect.objectContaining({
          code: "EXPECTED_VALUE_MISMATCH",
          severity: "error",
          field: "in_amount",
        }),
      ]);
    });
  });

  describe("signature", () => {
    it("reports SIGNATURE_WITHOUT_DOT_PREFIX when the payload was signed without the dot", () => {
      const report = checkSellPayload(buildInput({ signedOver: "no-dot" }));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_WITHOUT_DOT_PREFIX"]);
    });

    it("reports SIGNATURE_OVER_RAW_PROTOBUF when the raw protobuf bytes were signed", () => {
      const report = checkSellPayload(buildInput({ signedOver: "raw-protobuf" }));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_OVER_RAW_PROTOBUF"]);
    });

    it.each(["secp256k1", "secp256r1"] as const)(
      "reports SIGNATURE_INVALID when signed with another %s key",
      curve => {
        const input = buildInput({ curve });

        const report = checkSellPayload({
          ...input,
          signature: base64url(signCompact(curve, dotPrefixed(input.payload), OTHER_PRIVATE_KEY)),
        });

        expect(report.valid).toBe(false);
        expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
      },
    );

    describe("malformed signature", () => {
      const input = buildInput();
      const compact = signCompact("secp256k1", dotPrefixed(input.payload));

      it.each([
        ["an empty signature", ""],
        ["63 bytes", base64url(compact.slice(0, 63))],
        ["a hex signature", Buffer.from(compact).toString("hex")],
        ["out-of-range r and s", base64url(new Uint8Array(64).fill(0xff))],
        ["r = s = 0", base64url(new Uint8Array(64))],
      ])("reports SIGNATURE_MALFORMED without throwing for %s", (_case, signature) => {
        let report: SellPayloadCheckReport | undefined;
        expect(() => {
          report = checkSellPayload({ ...input, signature });
        }).not.toThrow();

        expect(report?.valid).toBe(false);
        expect(report && errorCodesOf(report)).toEqual(["SIGNATURE_MALFORMED"]);
      });
    });

    it("reports PUBLIC_KEY_MALFORMED and skips the signature check", () => {
      const report = checkSellPayload({
        ...buildInput(),
        partnerPublicKey: { curve: "secp256r1", data: Buffer.from("04" + "00".repeat(64), "hex") },
      });

      expect(report.valid).toBe(false);
      expect(codesOf(report)).toContain("PUBLIC_KEY_MALFORMED");
      for (const code of SIGNATURE_ERROR_CODES) expect(codesOf(report)).not.toContain(code);
    });
  });

  describe("APDU size", () => {
    // An unknown length-delimited field (15) pads the payload: the protobuf decoders skip it.
    const paddedToLength = (targetLength: number): SellPayloadCheckInput => {
      const { raw } = encodeFields(VALID_FIELDS);
      for (let padding = 0; padding < 600; padding++) {
        const length = padding < 128 ? [padding] : [(padding & 0x7f) | 0x80, padding >> 7];
        const padded = Buffer.concat([raw, Buffer.from([0x7a, ...length]), Buffer.alloc(padding)]);
        const payload = base64url(padded);
        if (payload.length === targetLength) {
          return {
            payload,
            signature: base64url(signCompact("secp256k1", dotPrefixed(payload))),
            partnerPublicKey: publicKeyFor("secp256k1"),
          };
        }
      }
      throw new Error(`no padding gives a ${targetLength}-character payload`);
    };

    // NG data is [encoding (1), length (2), payload, fee length (1), fee]: 509 bytes at most.
    it("accepts a payload that fits with any fee of up to 8 bytes", () => {
      const report = checkSellPayload(paddedToLength(496));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each([498, 504])("warns with PAYLOAD_NEAR_SIZE_LIMIT for %d characters", length => {
      const report = checkSellPayload(paddedToLength(length));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_NEAR_SIZE_LIMIT", severity: "warning" }),
      ]);
    });

    it("reports PAYLOAD_TOO_LARGE above 504 characters", () => {
      const report = checkSellPayload(paddedToLength(506));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_TOO_LARGE", severity: "error" }),
      ]);
    });

    it("measures the payload without its leading dot", () => {
      const input = paddedToLength(504);

      const report = checkSellPayload({ ...input, payload: `.${input.payload}` });

      expect(codesOf(report)).toEqual(["PAYLOAD_LEADING_DOT", "PAYLOAD_NEAR_SIZE_LIMIT"]);
    });
  });

  it("warns with PUBLIC_KEY_COMPRESSED for a valid compressed key and still verifies", () => {
    const input = buildInput({ curve: "secp256r1" });
    const compressed = Uint8Array.from(p256.getPublicKey(PARTNER_PRIVATE_KEY, true));

    const report = checkSellPayload({
      ...input,
      partnerPublicKey: { curve: "secp256r1", data: compressed },
    });

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: "PUBLIC_KEY_COMPRESSED",
        severity: "warning",
        message: expect.stringContaining("65-byte uncompressed"),
      }),
    ]);
  });

  it("reports all problems at once", () => {
    const report = checkSellPayload(
      buildInput({
        fields: {
          ...VALID_FIELDS,
          outCurrency: "",
          inAmount: Buffer.from([0x00]),
          inAddress: "a".repeat(200),
          deviceTransactionId: Buffer.alloc(31, 0xab),
        },
        signedOver: "raw-protobuf",
        expected: { inCurrency: "ETH" },
      }),
    );

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_FIELD", field: "out_currency" }),
        expect.objectContaining({ code: "ZERO_AMOUNT", field: "in_amount" }),
        expect.objectContaining({
          code: "INVALID_DEVICE_TRANSACTION_ID",
          field: "device_transaction_id",
        }),
        expect.objectContaining({ code: "FIELD_EXCEEDS_LIMIT", field: "in_address" }),
        expect.objectContaining({ code: "EXPECTED_VALUE_MISMATCH", field: "in_currency" }),
        expect.objectContaining({ code: "SIGNATURE_OVER_RAW_PROTOBUF" }),
      ]),
    );
  });
});
