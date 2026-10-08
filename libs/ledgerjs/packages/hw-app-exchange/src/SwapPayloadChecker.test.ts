import { createHash } from "node:crypto";
import { secp256k1 } from "@noble/curves/secp256k1";
import { p256 } from "@noble/curves/nist";
import { ledger_trade } from "./generate-protocol";
import {
  checkSwapPayload,
  type SwapPayloadCheckInput,
  type SwapPayloadCheckReport,
  type SwapPayloadIssueCode,
} from "./SwapPayloadChecker";

type CurveName = "secp256k1" | "secp256r1";
type NobleCurve = typeof secp256k1 | typeof p256;

const CURVES: Record<CurveName, NobleCurve> = { secp256k1, secp256r1: p256 };

// Deterministic (RFC6979) test keys, never used outside of these fixtures.
const PARTNER_PRIVATE_KEY = Uint8Array.from(Buffer.from("11".repeat(32), "hex"));
const OTHER_PRIVATE_KEY = Uint8Array.from(Buffer.from("22".repeat(32), "hex"));

const NONCE = Buffer.from("c0ffee".repeat(10) + "beef", "hex");
const NONCE_HEX = NONCE.toString("hex");

const VALID_FIELDS: ledger_trade.INewTransactionResponse = {
  payinAddress: "0x1111111111111111111111111111111111111111",
  refundAddress: "0x2222222222222222222222222222222222222222",
  payoutAddress: "bc1qtestpayoutaddress0000000000000000000",
  currencyFrom: "ETH",
  currencyTo: "BTC",
  amountToProvider: Buffer.from("0de0b6b3a7640000", "hex"),
  amountToWallet: Buffer.from("0186a0", "hex"),
  deviceTransactionIdNg: NONCE,
};

const sha256 = (message: Uint8Array): Uint8Array =>
  Uint8Array.from(createHash("sha256").update(message).digest());

const base64url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const encodeFields = (fields: ledger_trade.INewTransactionResponse) => {
  const message = ledger_trade.NewTransactionResponse.create(fields);
  const raw = ledger_trade.NewTransactionResponse.encode(message).finish();
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
  fields?: ledger_trade.INewTransactionResponse;
  curve?: CurveName;
  signedOver?: SignedOver;
  expected?: SwapPayloadCheckInput["expected"];
} = {}): SwapPayloadCheckInput => {
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

// Searches a fixed sequence of payin_extra_id values for a payload whose compact signature
// matches the predicate, so the resulting fixture is stable across runs.
const findSignedFixture = (
  curve: CurveName,
  predicate: (compact: Uint8Array) => boolean,
): SwapPayloadCheckInput => {
  for (let i = 0; i < 100_000; i++) {
    const { payload } = encodeFields({ ...VALID_FIELDS, payinExtraId: `lz${i}` });
    const compact = signCompact(curve, dotPrefixed(payload));
    if (predicate(compact)) {
      return {
        payload,
        signature: base64url(compact),
        partnerPublicKey: publicKeyFor(curve),
      };
    }
  }
  throw new Error("no matching signature found");
};

const codesOf = (report: SwapPayloadCheckReport): SwapPayloadIssueCode[] =>
  report.issues.map(issue => issue.code);

const errorCodesOf = (report: SwapPayloadCheckReport): SwapPayloadIssueCode[] =>
  report.issues.filter(issue => issue.severity === "error").map(issue => issue.code);

const SIGNATURE_ERROR_CODES: SwapPayloadIssueCode[] = [
  "SIGNATURE_MALFORMED",
  "SIGNATURE_WITHOUT_DOT_PREFIX",
  "SIGNATURE_OVER_RAW_PROTOBUF",
  "SIGNATURE_INVALID",
];

describe("checkSwapPayload", () => {
  describe("valid payloads", () => {
    it("accepts a valid secp256k1 payload and returns the decoded fields", () => {
      const report = checkSwapPayload(buildInput({ curve: "secp256k1" }));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
      expect(report.decoded).toMatchObject({
        payinAddress: VALID_FIELDS.payinAddress,
        refundAddress: VALID_FIELDS.refundAddress,
        payoutAddress: VALID_FIELDS.payoutAddress,
        currencyFrom: "ETH",
        currencyTo: "BTC",
        amountToProvider: 1_000_000_000_000_000_000n,
        amountToWallet: 100_000n,
        deviceTransactionIdNg: NONCE_HEX,
      });
    });

    it("accepts a valid secp256r1 payload", () => {
      const report = checkSwapPayload(buildInput({ curve: "secp256r1" }));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
      expect(report.decoded).toMatchObject({ deviceTransactionIdNg: NONCE_HEX });
    });

    // The "NG SWAP with prepared data" sample of Exchange.integ.test.ts, accepted by the Exchange
    // app on Speculos: an "=" padded payload (sent without its leading "."), its signature and the
    // SWAP_TEST partner public key of `appExchangeDataset`.
    it("accepts the Speculos-validated Swap NG sample with '=' padding", () => {
      const report = checkSwapPayload({
        payload:
          "CipiYzFxYXIwc3Jycjd4Zmt2eTVsNjQzbHlkbnc5cmU1OWd0enp3ZjVtZHEaKmJjMXFhcjBzcnJyN3hma3Z5NWw2NDNseWRudzlyZTU5Z3R6endmNHRlcSoqMHhiNzk0ZjVlYTBiYTM5NDk0Y2U4Mzk2MTNmZmZiYTc0Mjc5NTc5MjY4OgNCVENCA0JBVEoCBH5SBgV0-95gAGIgNQrqDJf3R_HQ92CBRhSkdSOAGxrrfQvLuqKk9Gv4GEs=",
        signature:
          "zGcNUYKM8sLxvT7zPU1C8vrMmanVlUroELnAeil4weo1LCk0zUBRse5-3Acv7I7II90xVTIxm26BnxRbZvVmTQ==",
        partnerPublicKey: {
          curve: "secp256k1",
          data: Uint8Array.from(
            Buffer.from(
              "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
              "hex",
            ),
          ),
        },
      });

      expect(report).toEqual({ valid: true, decoded: expect.any(Object), issues: [] });
      expect(report.decoded).toMatchObject({ currencyFrom: "BTC", currencyTo: "BAT" });
    });
  });

  describe("leading dot", () => {
    // Ledger Live sends "." + payload, so a payload that already has the dot reaches the device
    // as ".." + payload and is rejected.
    it("reports PAYLOAD_LEADING_DOT for a payload given in JWS form", () => {
      const input = buildInput();

      const report = checkSwapPayload({ ...input, payload: "." + input.payload });

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_LEADING_DOT", severity: "error" }),
      ]);
      expect(report.issues[0].message).toMatch(/Ledger Live adds the "\." itself/);
      expect(report.decoded).toMatchObject({ currencyFrom: "ETH", currencyTo: "BTC" });
    });

    it("still runs the other checks on the payload without the dot", () => {
      const input = buildInput({
        fields: { ...VALID_FIELDS, currencyTo: "" },
        signedOver: "no-dot",
      });

      const report = checkSwapPayload({ ...input, payload: "." + input.payload });

      expect(errorCodesOf(report)).toEqual([
        "PAYLOAD_LEADING_DOT",
        "MISSING_FIELD",
        "SIGNATURE_WITHOUT_DOT_PREFIX",
      ]);
    });

    it("reports PAYLOAD_LEADING_DOT and INVALID_ENCODING for a lone dot", () => {
      const report = checkSwapPayload({
        payload: ".",
        signature: base64url(signCompact("secp256k1", dotPrefixed("."))),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(codesOf(report)).toEqual(["PAYLOAD_LEADING_DOT", "INVALID_ENCODING"]);
    });
  });

  describe("encoding", () => {
    const { raw, payload } = encodeFields({ ...VALID_FIELDS, payinExtraId: "~~~" });
    const standardBase64 = Buffer.from(raw).toString("base64");

    // Signs "." + payload exactly as given, the bytes the device hashes.
    const signedAsGiven = (givenPayload: string): SwapPayloadCheckInput => ({
      payload: givenPayload,
      signature: base64url(signCompact("secp256k1", dotPrefixed(givenPayload))),
      partnerPublicKey: publicKeyFor("secp256k1"),
    });

    // The unpadded base64url length is never 4n+1: 4n+2 needs "==", 4n+3 needs "=".
    const payloadWithPadding = (padding: 1 | 2): string => {
      for (let i = 0; i < 3; i++) {
        const encoded = encodeFields({ ...VALID_FIELDS, payinExtraId: "x".repeat(i) }).payload;
        if (encoded.length % 4 === 4 - padding) return encoded + "=".repeat(padding);
      }
      throw new Error("no payload with the requested padding");
    };

    it("uses a fixture whose standard base64 differs from base64url", () => {
      expect(payload).toMatch(/-/);
      expect(payload).toMatch(/_/);
      expect(payload.length % 4).toBe(3);
      expect(standardBase64).toMatch(/\+/);
      expect(standardBase64).toMatch(/=$/);
    });

    // The Exchange app strips up to two trailing "=" and maps "/" like "_".
    it.each([
      ['one "=" of padding', payloadWithPadding(1)],
      ['two "=" of padding', payloadWithPadding(2)],
      ['"/" instead of "_"', payload.replace(/_/g, "/")],
      ['"/" and "=" padding', `${payload.replace(/_/g, "/")}=`],
    ])("accepts a payload with %s signed over it as given", (_case, givenPayload) => {
      const report = checkSwapPayload(signedAsGiven(givenPayload));

      expect(report).toEqual({
        valid: true,
        decoded: expect.objectContaining({ currencyFrom: "ETH", currencyTo: "BTC" }),
        issues: [],
      });
    });

    it("decodes a padded payload to the same bytes as the unpadded one", () => {
      const padded = payloadWithPadding(2);

      const report = checkSwapPayload(signedAsGiven(padded));
      const unpadded = checkSwapPayload(signedAsGiven(padded.replace(/=+$/, "")));

      expect(report.decoded).toEqual(unpadded.decoded);
    });

    it('verifies the signature over "." + payload including its padding', () => {
      const padded = payloadWithPadding(1);
      const unpadded = padded.replace(/=+$/, "");

      const report = checkSwapPayload({
        ...signedAsGiven(unpadded),
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
      ["a space", `${payload.slice(0, 8)} ${payload.slice(9)}`],
      ["an empty payload", ""],
    ])("reports INVALID_ENCODING for %s", (_case, badPayload) => {
      const report = checkSwapPayload(signedAsGiven(badPayload));

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      // Steps 2-5 and the signature checks are skipped when the encoding is wrong.
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "INVALID_ENCODING", severity: "error" }),
      ]);
      expect(report.issues[0].message).toMatch(/4n\+1/);
    });

    it("still reports PUBLIC_KEY_MALFORMED when the encoding is wrong", () => {
      const report = checkSwapPayload({
        payload: standardBase64,
        signature: base64url(signCompact("secp256k1", dotPrefixed(standardBase64))),
        partnerPublicKey: { curve: "secp256k1", data: Uint8Array.from([0x04, 0x01, 0x02]) },
      });

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(codesOf(report)).toEqual(["INVALID_ENCODING", "PUBLIC_KEY_MALFORMED"]);
      for (const code of SIGNATURE_ERROR_CODES) expect(codesOf(report)).not.toContain(code);
    });
  });

  describe("decoding", () => {
    it("reports PROTOBUF_DECODE_FAILED for bytes that are not a NewTransactionResponse", () => {
      // Field 1, length-delimited, with a length prefix that overflows the buffer.
      const payload = base64url(Uint8Array.from([0x0a, 0xff]));

      const report = checkSwapPayload({
        payload,
        signature: base64url(signCompact("secp256k1", dotPrefixed(payload))),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
    });

    it("still runs the signature checks when the payload does not decode", () => {
      const payload = base64url(Uint8Array.from([0x0a, 0xff]));

      const report = checkSwapPayload({
        payload,
        signature: base64url(signCompact("secp256k1", dotPrefixed(payload), OTHER_PRIVATE_KEY)),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED", "SIGNATURE_INVALID"]);
    });
  });

  describe("required fields", () => {
    it.each([
      ["payin_address", "payinAddress"],
      ["payout_address", "payoutAddress"],
      ["refund_address", "refundAddress"],
      ["currency_from", "currencyFrom"],
      ["currency_to", "currencyTo"],
      ["amount_to_provider", "amountToProvider"],
      ["amount_to_wallet", "amountToWallet"],
      ["device_transaction_id_ng", "deviceTransactionIdNg"],
    ] as const)("reports MISSING_FIELD when %s is missing", (field, key) => {
      const { [key]: _omitted, ...fields } = VALID_FIELDS;

      const report = checkSwapPayload(buildInput({ fields }));

      expect(report.valid).toBe(false);
      expect(report.issues.filter(issue => issue.code === "MISSING_FIELD")).toEqual([
        expect.objectContaining({ code: "MISSING_FIELD", severity: "error", field }),
      ]);
    });

    it("reports MISSING_FIELD when a required string field is empty", () => {
      const report = checkSwapPayload(
        buildInput({ fields: { ...VALID_FIELDS, payoutAddress: "" } }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ code: "MISSING_FIELD", field: "payout_address" }),
      );
    });

    it.each([
      ["amount_to_provider", "amountToProvider"],
      ["amount_to_wallet", "amountToWallet"],
    ] as const)("reports ZERO_AMOUNT when %s is 0", (field, key) => {
      const report = checkSwapPayload(
        buildInput({ fields: { ...VALID_FIELDS, [key]: Buffer.from([0x00]) } }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ code: "ZERO_AMOUNT", severity: "error", field }),
      );
      expect(codesOf(report)).not.toContain("MISSING_FIELD");
    });

    it.each([31, 33])(
      "reports INVALID_DEVICE_TRANSACTION_ID for a %i-byte device_transaction_id_ng",
      length => {
        const report = checkSwapPayload(
          buildInput({
            fields: { ...VALID_FIELDS, deviceTransactionIdNg: Buffer.alloc(length, 0xab) },
          }),
        );

        expect(report.valid).toBe(false);
        expect(report.issues).toContainEqual(
          expect.objectContaining({
            code: "INVALID_DEVICE_TRANSACTION_ID",
            severity: "error",
            field: "device_transaction_id_ng",
          }),
        );
      },
    );
  });

  describe("field size limits", () => {
    it("reports FIELD_EXCEEDS_LIMIT for an oversized payin_extra_id with max and actual sizes", () => {
      const report = checkSwapPayload(
        buildInput({ fields: { ...VALID_FIELDS, payinExtraId: "a".repeat(40) } }),
      );

      expect(report.valid).toBe(false);
      const issue = report.issues.find(({ code }) => code === "FIELD_EXCEEDS_LIMIT");
      expect(issue).toMatchObject({ severity: "error", field: "payin_extra_id" });
      expect(issue?.message).toMatch(/\b19\b/);
      expect(issue?.message).toMatch(/\b40\b/);
    });

    it("reports FIELD_EXCEEDS_LIMIT for an oversized currency_from", () => {
      const report = checkSwapPayload(
        buildInput({ fields: { ...VALID_FIELDS, currencyFrom: "A".repeat(10) } }),
      );

      expect(report.valid).toBe(false);
      const issue = report.issues.find(({ code }) => code === "FIELD_EXCEEDS_LIMIT");
      expect(issue).toMatchObject({ severity: "error", field: "currency_from" });
      expect(issue?.message).toMatch(/\b9\b/);
      expect(issue?.message).toMatch(/\b10\b/);
    });

    it("reports FIELD_EXCEEDS_LIMIT for an oversized bytes field (amount_to_wallet)", () => {
      const report = checkSwapPayload(
        buildInput({ fields: { ...VALID_FIELDS, amountToWallet: Buffer.alloc(17, 0xff) } }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ code: "FIELD_EXCEEDS_LIMIT", field: "amount_to_wallet" }),
      );
    });

    it("accepts every field sized exactly at the device usable limit", () => {
      const report = checkSwapPayload(
        buildInput({
          fields: {
            ...VALID_FIELDS,
            payinExtraId: "a".repeat(19),
            currencyFrom: "A".repeat(9),
            amountToWallet: Buffer.alloc(16, 0xff),
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
      currencyFrom: "ETH",
      currencyTo: "BTC",
      amountToProvider: 1_000_000_000_000_000_000n,
      amountToWallet: 100_000n,
      payinAddress: VALID_FIELDS.payinAddress ?? "",
      payoutAddress: VALID_FIELDS.payoutAddress ?? "",
      refundAddress: VALID_FIELDS.refundAddress ?? "",
    };

    it("reports no issue when every expected value matches", () => {
      const report = checkSwapPayload(buildInput({ expected: matchingExpected }));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each(["0x", "0X"])("accepts a %s prefixed expected deviceTransactionId", prefix => {
      const report = checkSwapPayload(
        buildInput({ expected: { deviceTransactionId: prefix + NONCE_HEX.toUpperCase() } }),
      );

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it("compares deviceTransactionId case-insensitively", () => {
      const report = checkSwapPayload(
        buildInput({ expected: { deviceTransactionId: NONCE_HEX.toUpperCase() } }),
      );

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it("reports EXPECTED_VALUE_MISMATCH for a different nonce and amount", () => {
      const report = checkSwapPayload(
        buildInput({
          expected: {
            ...matchingExpected,
            deviceTransactionId: "00".repeat(32),
            amountToWallet: 100_001n,
          },
        }),
      );

      expect(report.valid).toBe(false);
      const mismatches = report.issues.filter(({ code }) => code === "EXPECTED_VALUE_MISMATCH");
      expect(mismatches).toHaveLength(2);
      expect(mismatches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ severity: "error", field: "device_transaction_id_ng" }),
          expect.objectContaining({ severity: "error", field: "amount_to_wallet" }),
        ]),
      );
    });
  });

  describe("signature", () => {
    it("reports SIGNATURE_WITHOUT_DOT_PREFIX when the payload was signed without the dot", () => {
      const report = checkSwapPayload(buildInput({ signedOver: "no-dot" }));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_WITHOUT_DOT_PREFIX"]);
    });

    it("reports SIGNATURE_OVER_RAW_PROTOBUF when the raw protobuf bytes were signed", () => {
      const report = checkSwapPayload(buildInput({ signedOver: "raw-protobuf" }));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_OVER_RAW_PROTOBUF"]);
    });

    it.each(["secp256k1", "secp256r1"] as const)(
      "reports SIGNATURE_INVALID when signed with another %s key",
      curve => {
        const input = buildInput({ curve });

        const report = checkSwapPayload({
          ...input,
          signature: base64url(signCompact(curve, dotPrefixed(input.payload), OTHER_PRIVATE_KEY)),
        });

        expect(report.valid).toBe(false);
        expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
      },
    );

    it("reports SIGNATURE_INVALID for a secp256r1 signature checked against a secp256k1 key", () => {
      const input = buildInput({ curve: "secp256k1" });

      const report = checkSwapPayload({
        ...input,
        signature: base64url(signCompact("secp256r1", dotPrefixed(input.payload))),
      });

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
    });

    describe("malformed signature", () => {
      const input = buildInput();
      const compact = signCompact("secp256k1", dotPrefixed(input.payload));
      const der = CURVES.secp256k1
        .sign(sha256(dotPrefixed(input.payload)), PARTNER_PRIVATE_KEY, {
          lowS: false,
          prehash: false,
        })
        .toBytes("der");

      it.each([
        ["an empty signature", ""],
        ["63 bytes", base64url(compact.slice(0, 63))],
        ["65 bytes", base64url(Uint8Array.from([...compact, 0x00]))],
        ["a DER signature", base64url(der)],
      ])("reports SIGNATURE_MALFORMED for %s", (_case, signature) => {
        const report = checkSwapPayload({ ...input, signature });

        expect(report.valid).toBe(false);
        expect(report.issues).toContainEqual(
          expect.objectContaining({ code: "SIGNATURE_MALFORMED", severity: "error" }),
        );
      });

      // r and s equal to 0 or >= the curve order make noble throw instead of returning false.
      describe.each(["secp256k1", "secp256r1"] as const)("out-of-range r and s on %s", curve => {
        it.each([
          ["all 0x00 (r = s = 0)", 0x00],
          ["all 0xFF (r, s >= n)", 0xff],
        ])("reports SIGNATURE_MALFORMED without throwing for %s", (_case, byte) => {
          const curveInput = buildInput({ curve });
          const signature = base64url(new Uint8Array(64).fill(byte));

          let report: SwapPayloadCheckReport | undefined;
          expect(() => {
            report = checkSwapPayload({ ...curveInput, signature });
          }).not.toThrow();

          expect(report?.valid).toBe(false);
          expect(report && errorCodesOf(report)).toEqual(["SIGNATURE_MALFORMED"]);
        });
      });
    });

    describe.each(["secp256k1", "secp256r1"] as const)("public key on %s", curve => {
      it.each([
        ["a point that is not on the curve", Buffer.from("04" + "00".repeat(64), "hex")],
        ["a too short key", Uint8Array.from([0x04, 0x01, 0x02, 0x03])],
        ["an empty key", new Uint8Array(0)],
      ])("reports PUBLIC_KEY_MALFORMED for %s and skips the signature check", (_case, data) => {
        const input = buildInput({ curve });

        const report = checkSwapPayload({ ...input, partnerPublicKey: { curve, data } });

        expect(report.valid).toBe(false);
        expect(report.issues).toContainEqual(
          expect.objectContaining({ code: "PUBLIC_KEY_MALFORMED", severity: "error" }),
        );
        for (const code of SIGNATURE_ERROR_CODES) expect(codesOf(report)).not.toContain(code);
      });
    });

    describe.each(["secp256k1", "secp256r1"] as const)("leading zero bytes on %s", curve => {
      it.each([
        ["r", (sig: Uint8Array) => sig[0] === 0x00 && sig[32] !== 0x00],
        ["s", (sig: Uint8Array) => sig[0] !== 0x00 && sig[32] === 0x00],
      ])(
        "keeps the payload valid but warns with SIGNATURE_LEADING_ZERO when %s starts with 0x00",
        (_part, predicate) => {
          const input = findSignedFixture(curve, predicate);

          const report = checkSwapPayload(input);

          expect(report.valid).toBe(true);
          expect(report.issues).toEqual([
            expect.objectContaining({ code: "SIGNATURE_LEADING_ZERO", severity: "warning" }),
          ]);
        },
      );
    });
  });

  it("reports all problems at once", () => {
    const input = buildInput({
      fields: {
        ...VALID_FIELDS,
        currencyTo: "",
        amountToProvider: Buffer.from([0x00]),
        payinExtraId: "a".repeat(40),
        deviceTransactionIdNg: Buffer.alloc(31, 0xab),
      },
      signedOver: "no-dot",
      expected: { currencyFrom: "BTC" },
    });

    const report = checkSwapPayload(input);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_FIELD", field: "currency_to" }),
        expect.objectContaining({ code: "ZERO_AMOUNT", field: "amount_to_provider" }),
        expect.objectContaining({
          code: "INVALID_DEVICE_TRANSACTION_ID",
          field: "device_transaction_id_ng",
        }),
        expect.objectContaining({ code: "FIELD_EXCEEDS_LIMIT", field: "payin_extra_id" }),
        expect.objectContaining({ code: "EXPECTED_VALUE_MISMATCH", field: "currency_from" }),
        expect.objectContaining({ code: "SIGNATURE_WITHOUT_DOT_PREFIX" }),
      ]),
    );
    expect(report.issues.every(({ message }) => message.length > 0)).toBe(true);
  });
});

describe("checkSwapPayload legacy", () => {
  const LEGACY_NONCE = "ABCDEFGHIJ";

  const { deviceTransactionIdNg: _ngNonce, ...LEGACY_FIELDS } = {
    ...VALID_FIELDS,
    deviceTransactionId: LEGACY_NONCE,
  };

  const buildLegacyInput = ({
    fields = LEGACY_FIELDS,
    curve = "secp256k1",
    privateKey = PARTNER_PRIVATE_KEY,
    expected,
  }: {
    fields?: ledger_trade.INewTransactionResponse;
    curve?: CurveName;
    privateKey?: Uint8Array;
    expected?: SwapPayloadCheckInput["expected"];
  } = {}): SwapPayloadCheckInput => {
    const { raw } = encodeFields(fields);
    return {
      format: "legacy",
      payload: Buffer.from(raw).toString("hex"),
      // The device verifies a legacy swap signature over SHA-256 of the raw protobuf bytes.
      signature: Buffer.from(signCompact(curve, raw, privateKey)).toString("hex"),
      partnerPublicKey: publicKeyFor(curve),
      ...(expected ? { expected } : {}),
    };
  };

  it("accepts a valid secp256k1 legacy payload and returns the decoded fields", () => {
    const report = checkSwapPayload(buildLegacyInput());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.decoded).toMatchObject({
      payinAddress: VALID_FIELDS.payinAddress,
      currencyFrom: "ETH",
      currencyTo: "BTC",
      amountToProvider: 1_000_000_000_000_000_000n,
      amountToWallet: 100_000n,
      deviceTransactionId: LEGACY_NONCE,
    });
  });

  // app-exchange set_partner_key.c: a legacy swap partner key is always read as secp256k1.
  describe("secp256r1 partner key", () => {
    it("reports LEGACY_CURVE_UNSUPPORTED for a payload correctly signed with secp256r1", () => {
      const report = checkSwapPayload(buildLegacyInput({ curve: "secp256r1" }));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "LEGACY_CURVE_UNSUPPORTED",
          severity: "error",
          message: expect.stringContaining("secp256k1 only"),
        }),
      ]);
      expect(report.decoded).toMatchObject({ deviceTransactionId: LEGACY_NONCE });
    });

    it("reports LEGACY_CURVE_UNSUPPORTED instead of a signature issue", () => {
      const input = buildLegacyInput({ curve: "secp256r1", privateKey: OTHER_PRIVATE_KEY });

      expect(errorCodesOf(checkSwapPayload(input))).toEqual(["LEGACY_CURVE_UNSUPPORTED"]);
      expect(errorCodesOf(checkSwapPayload({ ...input, signature: "" }))).toEqual([
        "LEGACY_CURVE_UNSUPPORTED",
      ]);
    });

    it("reports it next to PUBLIC_KEY_COMPRESSED for a compressed key", () => {
      const input = buildLegacyInput({ curve: "secp256r1" });
      const compressed = Uint8Array.from(p256.getPublicKey(PARTNER_PRIVATE_KEY, true));

      const report = checkSwapPayload({
        ...input,
        partnerPublicKey: { curve: "secp256r1", data: compressed },
      });

      expect(report.valid).toBe(false);
      expect(codesOf(report)).toEqual(["PUBLIC_KEY_COMPRESSED", "LEGACY_CURVE_UNSUPPORTED"]);
    });
  });

  // Ledger Live sends Buffer.from(payload, "hex"), which is empty for a "0x" prefixed payload.
  it.each(["0x", "0X"])(
    "reports INVALID_ENCODING for a %s prefixed hex payload and still decodes it",
    prefix => {
      const input = buildLegacyInput();

      const report = checkSwapPayload({ ...input, payload: prefix + input.payload });

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "INVALID_ENCODING", severity: "error" }),
      ]);
      expect(report.issues[0].message).toMatch(/remove the "0x" prefix/);
      expect(report.decoded).toMatchObject({ deviceTransactionId: LEGACY_NONCE });
    },
  );

  it("reports the other issues of a 0x prefixed hex payload", () => {
    const input = buildLegacyInput({
      fields: { ...LEGACY_FIELDS, currencyTo: "" },
      privateKey: OTHER_PRIVATE_KEY,
    });

    const report = checkSwapPayload({ ...input, payload: `0x${input.payload}` });

    expect(errorCodesOf(report)).toEqual([
      "INVALID_ENCODING",
      "MISSING_FIELD",
      "SIGNATURE_INVALID",
    ]);
  });

  it("accepts an uppercase hex payload", () => {
    const input = buildLegacyInput();

    const report = checkSwapPayload({ ...input, payload: input.payload.toUpperCase() });

    expect(report.valid).toBe(true);
  });

  it("accepts an uppercase hex signature", () => {
    const input = buildLegacyInput();

    const report = checkSwapPayload({ ...input, signature: input.signature.toUpperCase() });

    expect(report.valid).toBe(true);
  });

  // Ledger Live only hex-decodes a legacy swap signature, there is no base64url fallback.
  it("reports SIGNATURE_MALFORMED for the base64url of the 64-byte signature", () => {
    const input = buildLegacyInput();

    const report = checkSwapPayload({
      ...input,
      signature: base64url(Buffer.from(input.signature, "hex")),
    });

    expect(report.valid).toBe(false);
    expect(errorCodesOf(report)).toEqual(["SIGNATURE_MALFORMED"]);
    expect(report.issues[0].message).toMatch(/128 hex characters/);
  });

  describe("encoding", () => {
    const { payload } = buildLegacyInput();

    it.each([
      ["a base64url payload", encodeFields(LEGACY_FIELDS).payload],
      ["an odd-length hex payload", payload.slice(0, -1)],
      ["a non-hex character", `${payload.slice(0, -2)}zz`],
      ["a JWS leading dot", `.${payload}`],
      ["an empty payload", ""],
      ["a lone 0x prefix", "0x"],
    ])("reports INVALID_ENCODING for %s", (_case, badPayload) => {
      const report = checkSwapPayload({ ...buildLegacyInput(), payload: badPayload });

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "INVALID_ENCODING", severity: "error" }),
      ]);
    });

    it("reports PROTOBUF_DECODE_FAILED for hex bytes that are not a NewTransactionResponse", () => {
      const raw = Uint8Array.from([0x0a, 0xff]);

      const report = checkSwapPayload({
        format: "legacy",
        payload: Buffer.from(raw).toString("hex"),
        signature: Buffer.from(signCompact("secp256k1", raw)).toString("hex"),
        partnerPublicKey: publicKeyFor("secp256k1"),
      });

      expect(report.valid).toBe(false);
      expect(report.decoded).toBeUndefined();
      expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
    });
  });

  describe("device_transaction_id", () => {
    it("reports MISSING_FIELD when device_transaction_id is missing", () => {
      const { deviceTransactionId: _omitted, ...fields } = LEGACY_FIELDS;

      const report = checkSwapPayload(buildLegacyInput({ fields }));

      expect(report.valid).toBe(false);
      expect(report.issues.filter(({ code }) => code === "MISSING_FIELD")).toEqual([
        expect.objectContaining({ field: "device_transaction_id" }),
      ]);
    });

    it("does not require device_transaction_id_ng", () => {
      const report = checkSwapPayload(buildLegacyInput());

      expect(codesOf(report)).not.toContain("MISSING_FIELD");
    });

    it.each([
      ["9 characters", "ABCDEFGHI"],
      ["11 characters", "ABCDEFGHIJK"],
      ["10 characters with a non ASCII one", "ABCDEFGHIÉ"],
    ])("reports INVALID_DEVICE_TRANSACTION_ID for %s", (_case, deviceTransactionId) => {
      const report = checkSwapPayload(
        buildLegacyInput({ fields: { ...LEGACY_FIELDS, deviceTransactionId } }),
      );

      expect(report.valid).toBe(false);
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          code: "INVALID_DEVICE_TRANSACTION_ID",
          severity: "error",
          field: "device_transaction_id",
        }),
      );
    });

    it("reports no issue when the expected nonce matches exactly", () => {
      const report = checkSwapPayload(
        buildLegacyInput({
          expected: { deviceTransactionId: LEGACY_NONCE, amountToWallet: 100_000n },
        }),
      );

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each([
      ["a different nonce", "ZZZZZZZZZZ"],
      ["a different case", LEGACY_NONCE.toLowerCase()],
    ])("reports EXPECTED_VALUE_MISMATCH for %s", (_case, deviceTransactionId) => {
      const report = checkSwapPayload(buildLegacyInput({ expected: { deviceTransactionId } }));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "EXPECTED_VALUE_MISMATCH",
          field: "device_transaction_id",
        }),
      ]);
    });
  });

  it("reports FIELD_EXCEEDS_LIMIT with the legacy nonce limit", () => {
    const report = checkSwapPayload(
      buildLegacyInput({ fields: { ...LEGACY_FIELDS, payinExtraId: "a".repeat(40) } }),
    );

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ code: "FIELD_EXCEEDS_LIMIT", field: "payin_extra_id" }),
    );
  });

  describe("signature", () => {
    it('reports SIGNATURE_INVALID when signed over "." + hex payload', () => {
      const input = buildLegacyInput();

      const report = checkSwapPayload({
        ...input,
        signature: Buffer.from(signCompact("secp256k1", dotPrefixed(input.payload))).toString(
          "hex",
        ),
      });

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
    });

    it("reports SIGNATURE_INVALID when signed with another key", () => {
      const report = checkSwapPayload(buildLegacyInput({ privateKey: OTHER_PRIVATE_KEY }));

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["SIGNATURE_INVALID"]);
    });

    it("reports PUBLIC_KEY_MALFORMED and skips the signature check", () => {
      const report = checkSwapPayload({
        ...buildLegacyInput({ privateKey: OTHER_PRIVATE_KEY }),
        partnerPublicKey: { curve: "secp256k1", data: Uint8Array.from([0x04, 0x01]) },
      });

      expect(errorCodesOf(report)).toEqual(["PUBLIC_KEY_MALFORMED"]);
    });

    describe("malformed signature", () => {
      const input = buildLegacyInput();
      const { raw } = encodeFields(LEGACY_FIELDS);
      const der = CURVES.secp256k1
        .sign(sha256(raw), PARTNER_PRIVATE_KEY, { lowS: false, prehash: false })
        .toBytes("der");

      it.each([
        ["an empty signature", ""],
        ["a hex DER signature", Buffer.from(der).toString("hex")],
        ["a base64url DER signature", base64url(der)],
        ["63 bytes of hex", input.signature.slice(0, 126)],
        ["65 bytes of hex", `${input.signature}00`],
        ['a "0x" prefixed hex signature', `0x${input.signature}`],
        ["out-of-range r and s", "ff".repeat(64)],
      ])("reports SIGNATURE_MALFORMED without throwing for %s", (_case, signature) => {
        let report: SwapPayloadCheckReport | undefined;
        expect(() => {
          report = checkSwapPayload({ ...input, signature });
        }).not.toThrow();

        expect(report?.valid).toBe(false);
        expect(report && errorCodesOf(report)).toEqual(["SIGNATURE_MALFORMED"]);
      });
    });
  });

  it("keeps the NG behaviour when format is omitted or explicitly ng", () => {
    const ngInput = buildInput();
    const legacyInput = buildLegacyInput();

    expect(checkSwapPayload({ ...ngInput, format: "ng" })).toEqual(checkSwapPayload(ngInput));
    expect(checkSwapPayload({ ...legacyInput, format: undefined }).valid).toBe(false);
  });
});

// Builds raw NewTransactionResponse bytes with extra wire fields appended: `payin_extra_data`
// (13) is not in the generated JS protocol, and an unknown field (15) pads the payload.
const lengthDelimited = (fieldNumber: number, content: Uint8Array): Buffer => {
  const length = content.length;
  const lengthBytes = length < 128 ? [length] : [(length & 0x7f) | 0x80, length >> 7];
  return Buffer.concat([Buffer.from([(fieldNumber << 3) | 2, ...lengthBytes]), content]);
};

const signNg = (raw: Uint8Array, curve: CurveName = "secp256k1"): SwapPayloadCheckInput => {
  const payload = base64url(raw);
  return {
    payload,
    signature: base64url(signCompact(curve, dotPrefixed(payload))),
    partnerPublicKey: publicKeyFor(curve),
  };
};

const signLegacy = (raw: Uint8Array): SwapPayloadCheckInput => ({
  format: "legacy",
  payload: Buffer.from(raw).toString("hex"),
  signature: Buffer.from(signCompact("secp256k1", raw)).toString("hex"),
  partnerPublicKey: publicKeyFor("secp256k1"),
});

const LEGACY_SAMPLE_FIELDS: ledger_trade.INewTransactionResponse = {
  ...VALID_FIELDS,
  deviceTransactionIdNg: undefined,
  deviceTransactionId: "ABCDEFGHIJ",
};

describe("checkSwapPayload APDU size", () => {
  const paddedRaw = (fields: ledger_trade.INewTransactionResponse, padding: number) =>
    Buffer.concat([encodeFields(fields).raw, lengthDelimited(15, Buffer.alloc(padding))]);

  describe("NG", () => {
    const ngOfLength = (targetLength: number): SwapPayloadCheckInput => {
      for (let padding = 0; padding < 600; padding++) {
        const raw = paddedRaw(VALID_FIELDS, padding);
        if (base64url(raw).length === targetLength) return signNg(raw);
      }
      throw new Error(`no padding gives a ${targetLength}-character payload`);
    };

    it("accepts a payload that fits with any fee of up to 8 bytes", () => {
      const report = checkSwapPayload(ngOfLength(496));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each([498, 504])("warns with PAYLOAD_NEAR_SIZE_LIMIT for %d characters", length => {
      const report = checkSwapPayload(ngOfLength(length));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_NEAR_SIZE_LIMIT", severity: "warning" }),
      ]);
    });

    it.each([506, 600])("reports PAYLOAD_TOO_LARGE for %d characters", length => {
      const report = checkSwapPayload(ngOfLength(length));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_TOO_LARGE", severity: "error" }),
      ]);
    });

    it("counts the base64url characters sent, padding included", () => {
      const input = ngOfLength(504);
      const padded = `${input.payload}==`;

      const report = checkSwapPayload({
        ...input,
        payload: padded,
        signature: base64url(signCompact("secp256k1", dotPrefixed(padded))),
      });

      expect(errorCodesOf(report)).toEqual(["PAYLOAD_TOO_LARGE"]);
    });
  });

  describe("legacy", () => {
    const legacyOfBytes = (targetBytes: number): SwapPayloadCheckInput => {
      for (let padding = 0; padding < 300; padding++) {
        const raw = paddedRaw(LEGACY_SAMPLE_FIELDS, padding);
        if (raw.length === targetBytes) return signLegacy(raw);
      }
      throw new Error(`no padding gives a ${targetBytes}-byte payload`);
    };

    // Legacy data is [length (1), payload, fee length (1), fee] in one APDU of at most 255 bytes.
    it("accepts a payload that fits with any fee of up to 8 bytes", () => {
      const report = checkSwapPayload(legacyOfBytes(245));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });

    it.each([246, 252])("warns with PAYLOAD_NEAR_SIZE_LIMIT for %d bytes", bytes => {
      const report = checkSwapPayload(legacyOfBytes(bytes));

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_NEAR_SIZE_LIMIT", severity: "warning" }),
      ]);
    });

    it.each([253, 300])("reports PAYLOAD_TOO_LARGE for %d bytes", bytes => {
      const report = checkSwapPayload(legacyOfBytes(bytes));

      expect(report.valid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({ code: "PAYLOAD_TOO_LARGE", severity: "error" }),
      ]);
    });

    it("reports PAYLOAD_TOO_LARGE for addresses within their field limits", () => {
      const report = checkSwapPayload(
        signLegacy(
          encodeFields({
            ...LEGACY_SAMPLE_FIELDS,
            payinAddress: "a".repeat(150),
            payoutAddress: "b".repeat(150),
          }).raw,
        ),
      );

      expect(errorCodesOf(report)).toEqual(["PAYLOAD_TOO_LARGE"]);
    });
  });
});

describe.each([
  ["NG", VALID_FIELDS, signNg],
  ["legacy", LEGACY_SAMPLE_FIELDS, signLegacy],
] as const)("checkSwapPayload payin_extra_data (%s)", (_format, baseFields, sign) => {
  const withExtraData = (
    extraData: Uint8Array[],
    fields: ledger_trade.INewTransactionResponse = baseFields,
  ) =>
    checkSwapPayload(
      sign(
        Buffer.concat([
          encodeFields(fields).raw,
          ...extraData.map(content => lengthDelimited(13, content)),
        ]),
      ),
    );

  const HASH_WITH_HEADER = Buffer.concat([Buffer.from([0x01]), Buffer.alloc(32, 0xcd)]);

  it("accepts a 33-byte payin_extra_data and decodes it as hex", () => {
    const report = withExtraData([HASH_WITH_HEADER]);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.decoded?.payinExtraData).toBe(HASH_WITH_HEADER.toString("hex"));
  });

  it("leaves payinExtraData out of the decoded payload when absent", () => {
    const report = checkSwapPayload(sign(encodeFields(baseFields).raw));

    expect(report.valid).toBe(true);
    expect(report.decoded).not.toHaveProperty("payinExtraData");
  });

  it.each([
    ["empty", new Uint8Array()],
    ["the single native id byte 0x00", Uint8Array.from([0x00])],
  ])("accepts a payin_extra_data %s together with a payin_extra_id", (_case, extraData) => {
    const report = withExtraData([extraData], { ...baseFields, payinExtraId: "memo" });

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it.each([
    ["1 byte other than 0x00", Uint8Array.from([0x01]), 1],
    ["32 bytes", Buffer.alloc(32, 0xcd), 32],
  ])("reports INVALID_PAYIN_EXTRA_DATA for %s", (_case, extraData, size) => {
    const report = withExtraData([extraData]);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: "INVALID_PAYIN_EXTRA_DATA",
        severity: "error",
        field: "payin_extra_data",
        message: expect.stringContaining(`is ${size} bytes`),
      }),
    ]);
  });

  it("reports FIELD_EXCEEDS_LIMIT for a 34-byte payin_extra_data", () => {
    const report = withExtraData([Buffer.alloc(34, 0xcd)]);

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: "FIELD_EXCEEDS_LIMIT",
        field: "payin_extra_data",
        message: expect.stringMatching(/34 bytes.*at most 33 bytes/),
      }),
    ]);
  });

  it("reports EXTRA_ID_AND_EXTRA_DATA when payin_extra_id and payin_extra_data are both set", () => {
    const report = withExtraData([HASH_WITH_HEADER], { ...baseFields, payinExtraId: "memo" });

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: "EXTRA_ID_AND_EXTRA_DATA",
        severity: "error",
        field: "payin_extra_data",
      }),
    ]);
  });

  it("checks the last occurrence, like the protobuf decoders", () => {
    expect(withExtraData([Buffer.alloc(32, 0xcd), HASH_WITH_HEADER]).valid).toBe(true);
    expect(codesOf(withExtraData([HASH_WITH_HEADER, Buffer.alloc(32, 0xcd)]))).toEqual([
      "INVALID_PAYIN_EXTRA_DATA",
    ]);
  });

  it("reports FIELD_EXCEEDS_LIMIT when any occurrence is oversized", () => {
    expect(codesOf(withExtraData([Buffer.alloc(40), HASH_WITH_HEADER]))).toEqual([
      "FIELD_EXCEEDS_LIMIT",
    ]);
  });

  // protobufjs skips these, nanopb fails to decode the message.
  describe("wire data the Exchange app rejects", () => {
    const withRawSuffix = (suffix: number[]) =>
      checkSwapPayload(sign(Buffer.concat([encodeFields(baseFields).raw, Buffer.from(suffix)])));

    it.each([
      ["an unknown field as a group", [0x7b, 0x7c]],
      ["a group wrapping a field", [0x7b, 0x08, 0x01, 0x7c]],
      ["payin_extra_data as a varint", [0x68, 0x01]],
      ["payin_extra_data as a 32-bit value", [0x6d, 0x00, 0x00, 0x00, 0x00]],
      ["payin_extra_data as a 64-bit value", [0x69, ...new Array(8).fill(0)]],
      ["a truncated payin_extra_data length", [0x6a, 0x05, 0x01]],
    ])("reports PROTOBUF_DECODE_FAILED for %s", (_case, suffix) => {
      const report = withRawSuffix(suffix);

      expect(report.valid).toBe(false);
      expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
    });

    it("still accepts an unknown varint, 32-bit or 64-bit field", () => {
      const report = withRawSuffix([
        0x78,
        0x01,
        0x7d,
        ...new Array(4).fill(0),
        0x79,
        ...new Array(8).fill(0),
      ]);

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([]);
    });
  });
});

describe.each([
  ["NG", VALID_FIELDS, signNg],
  ["legacy", LEGACY_SAMPLE_FIELDS, signLegacy],
] as const)("checkSwapPayload duplicate fields (%s)", (_format, baseFields, sign) => {
  it.each([
    ["payin_extra_id", 2, 20, 19],
    ["currency_from", 7, 10, 9],
    ["amount_to_wallet", 10, 17, 16],
  ])(
    "reports FIELD_EXCEEDS_LIMIT for an oversized %s followed by a valid duplicate",
    (field, fieldNumber, actual, limit) => {
      const raw = Buffer.concat([
        lengthDelimited(fieldNumber, Buffer.alloc(actual, 0x61)),
        encodeFields({ ...baseFields, payinExtraId: "memo" }).raw,
      ]);

      const report = checkSwapPayload(sign(raw));

      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "FIELD_EXCEEDS_LIMIT",
          field,
          message: expect.stringContaining(
            `is ${actual} bytes, the Exchange app accepts at most ${limit} bytes`,
          ),
        }),
      ]);
    },
  );

  it("reports PROTOBUF_DECODE_FAILED for a known field sent as a varint", () => {
    const report = checkSwapPayload(
      sign(Buffer.concat([encodeFields(baseFields).raw, Buffer.from([0x10, 0x00])])),
    );

    expect(errorCodesOf(report)).toEqual(["PROTOBUF_DECODE_FAILED"]);
  });
});

describe("checkSwapPayload partner public key", () => {
  it.each(["secp256k1", "secp256r1"] as const)(
    "warns with PUBLIC_KEY_COMPRESSED for a valid compressed %s key and still verifies",
    curve => {
      const input = buildInput({ curve });
      const compressed = Uint8Array.from(CURVES[curve].getPublicKey(PARTNER_PRIVATE_KEY, true));

      const report = checkSwapPayload({ ...input, partnerPublicKey: { curve, data: compressed } });

      expect(report.valid).toBe(true);
      expect(report.issues).toEqual([
        expect.objectContaining({
          code: "PUBLIC_KEY_COMPRESSED",
          severity: "warning",
          message: expect.stringContaining("65-byte uncompressed"),
        }),
      ]);
    },
  );

  it("still reports SIGNATURE_INVALID next to PUBLIC_KEY_COMPRESSED", () => {
    const input = buildInput();
    const compressed = Uint8Array.from(secp256k1.getPublicKey(OTHER_PRIVATE_KEY, true));

    const report = checkSwapPayload({
      ...input,
      partnerPublicKey: { curve: "secp256k1", data: compressed },
    });

    expect(codesOf(report)).toEqual(["PUBLIC_KEY_COMPRESSED", "SIGNATURE_INVALID"]);
  });

  it("warns for a compressed key on a legacy payload too", () => {
    const input = signLegacy(encodeFields(LEGACY_SAMPLE_FIELDS).raw);
    const compressed = Uint8Array.from(secp256k1.getPublicKey(PARTNER_PRIVATE_KEY, true));

    const report = checkSwapPayload({
      ...input,
      partnerPublicKey: { curve: "secp256k1", data: compressed },
    });

    expect(report.valid).toBe(true);
    expect(codesOf(report)).toEqual(["PUBLIC_KEY_COMPRESSED"]);
  });

  it("explains that the registered key must be uncompressed when the key is malformed", () => {
    const report = checkSwapPayload({
      ...buildInput(),
      partnerPublicKey: { curve: "secp256k1", data: Uint8Array.from([0x04, 0x01]) },
    });

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: "PUBLIC_KEY_MALFORMED",
        message: expect.stringContaining("65-byte uncompressed"),
      }),
    );
  });
});
