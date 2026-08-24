import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import { secp256k1 } from "@noble/curves/secp256k1";
import { p256 } from "@noble/curves/nist";
import BigNumber from "bignumber.js";
import { CompleteExchangeError } from "../error";
import { sha256 } from "../../crypto";
import {
  enrichSwapDeserializationError,
  enrichSwapSignatureVerificationError,
  getBufferedDexGasLimit,
  shouldForceZeroAmountForDexSwap,
} from "./completeExchange";

describe("getBufferedDexGasLimit", () => {
  it.each([
    ["caps HyperEVM at 2.9M", "hyperevm", 3_000_000, "2900000"],
    ["keeps a buffered HyperEVM value below the cap", "hyperevm", 2_000_000, "2600000"],
    ["does not cap other EVM currencies", "ethereum", 3_000_000, "3900000"],
  ])("%s", (_case, fromCurrencyId, gasLimit, expected) => {
    expect(
      getBufferedDexGasLimit({
        gasLimit: new BigNumber(gasLimit),
        fromCurrencyId,
      }).toFixed(),
    ).toBe(expected);
  });
});

describe("shouldForceZeroAmountForDexSwap", () => {
  const base = {
    isDex: true,
    family: "evm",
    hasSubAccountId: false,
    fromCurrencyId: "ethereum",
  };

  it.each([
    ["EVM DEX swap from arc_testnet", { fromCurrencyId: "arc_testnet" }, true],
    ["EVM DEX swap from arc", { fromCurrencyId: "arc" }, true],
    ["EVM DEX swap from a token sub-account", { hasSubAccountId: true }, true],
    ["provider is not a DEX", { isDex: false, fromCurrencyId: "arc_testnet" }, false],
    ["family is not evm", { family: "bitcoin", fromCurrencyId: "arc" }, false],
    ["non-Arc native coin without sub-account", {}, false],
  ])("%s", (_case, params, expected) => {
    expect(shouldForceZeroAmountForDexSwap({ ...base, ...params })).toBe(expected);
  });
});

describe("enrichSwapDeserializationError", () => {
  // Minimal NewTransactionResponse protobuf with only payin_extra_id (field 2) = 40 * "a",
  // which is above the device's 19-byte usable limit for that field.
  const payloadWithOversizedExtraId = "1228" + "61".repeat(40);

  it("enriches a device DESERIALIZATION_FAILED with the precise offending field", () => {
    const deviceError = new TransportStatusError(ErrorStatus.DESERIALIZATION_FAILED);

    const result = enrichSwapDeserializationError(
      "PROCESS_TRANSACTION",
      payloadWithOversizedExtraId,
      deviceError,
    );

    expect(result).toBeInstanceOf(CompleteExchangeError);
    // Title stays the device error's translation key so the user-facing copy is unchanged;
    // the precise field only enriches the message (logs/analytics).
    expect(result).toMatchObject({
      step: "PROCESS_TRANSACTION",
      title: "deserializationFailed",
    });
    expect(result?.message).toContain("payin_extra_id");
  });

  it("returns undefined for a DESERIALIZATION_FAILED when no field violation is found", () => {
    const deviceError = new TransportStatusError(ErrorStatus.DESERIALIZATION_FAILED);
    // Payload cannot be decoded locally -> defer to the device's generic error.
    expect(
      enrichSwapDeserializationError("PROCESS_TRANSACTION", "0aff", deviceError),
    ).toBeUndefined();
  });

  it("returns undefined for unrelated device status codes", () => {
    const deviceError = new TransportStatusError(ErrorStatus.INVALID_ADDRESS);
    expect(
      enrichSwapDeserializationError(
        "CHECK_REFUND_ADDRESS",
        payloadWithOversizedExtraId,
        deviceError,
      ),
    ).toBeUndefined();
  });

  it("returns undefined for non-transport errors", () => {
    expect(
      enrichSwapDeserializationError(
        "PROCESS_TRANSACTION",
        payloadWithOversizedExtraId,
        new Error("boom"),
      ),
    ).toBeUndefined();
  });
});

describe("enrichSwapSignatureVerificationError", () => {
  // Deterministic (RFC6979) partner key shared by every case so signatures are reproducible.
  const PRIVATE_KEY = Uint8Array.from(Buffer.from("11".repeat(32), "hex"));
  const signVerificationFail = new TransportStatusError(ErrorStatus.SIGN_VERIFICATION_FAIL);

  const base64url = (buffer: Buffer): string =>
    buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  type NobleCurve = typeof secp256k1 | typeof p256;

  const curves: { curveName: "secp256k1" | "secp256r1"; curve: NobleCurve }[] = [
    { curveName: "secp256k1", curve: secp256k1 },
    { curveName: "secp256r1", curve: p256 },
  ];

  // `prehash: false` mirrors production verification: the sha256 digest is the message, so signing
  // must not hash it again (guards against a double-hash if the @noble/curves default ever changes).
  const signCompact = (curve: NobleCurve, message: Buffer): Buffer =>
    Buffer.from(
      curve.sign(sha256(message), PRIVATE_KEY, { lowS: false, prehash: false }).toCompactRawBytes(),
    );

  const publicKeyFor = (curve: NobleCurve, curveName: "secp256k1" | "secp256r1") => ({
    curve: curveName,
    data: Buffer.from(curve.getPublicKey(PRIVATE_KEY, false)),
  });

  // Search the deterministic signature space for a "." + payload whose compact r/s bytes match a
  // leading-zero predicate. Iteration is fixed, so the discovered payload is stable across runs.
  const findDotPrefixedPayload = (
    curve: NobleCurve,
    prefix: string,
    predicate: (compact: Buffer) => boolean,
  ): { payload: string; signature: string } => {
    for (let i = 0; i < 500_000; i++) {
      const payload = `${prefix}${i}`;
      const compact = signCompact(curve, Buffer.from("." + payload));
      if (predicate(compact)) return { payload, signature: base64url(compact) };
    }
    throw new Error(`no matching signature found for ${prefix}`);
  };

  const enrich = (params: {
    binaryPayload: string;
    signature: string;
    curveName: "secp256k1" | "secp256r1";
    curve: NobleCurve;
    step?: Parameters<typeof enrichSwapSignatureVerificationError>[0]["step"];
    isSwapNg?: boolean;
    error?: unknown;
  }) =>
    enrichSwapSignatureVerificationError({
      step: params.step ?? "CHECK_TRANSACTION_SIGNATURE",
      isSwapNg: params.isSwapNg ?? true,
      binaryPayload: params.binaryPayload,
      signature: params.signature,
      publicKey: publicKeyFor(params.curve, params.curveName),
      error: params.error ?? signVerificationFail,
    });

  describe.each(curves)("on the $curveName curve", ({ curveName, curve }) => {
    it("flags a valid signature the device still rejected as a device-only mismatch", () => {
      // A signature over the exact device input with no leading-zero r/s.
      const { payload, signature } = findDotPrefixedPayload(
        curve,
        "device-mismatch-",
        compact => compact[0] !== 0x00 && compact[32] !== 0x00,
      );

      const result = enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
      });

      // Title stays the device translation key; only the message carries the diagnostic.
      expect(result).toBeInstanceOf(CompleteExchangeError);
      expect(result).toMatchObject({
        step: "CHECK_TRANSACTION_SIGNATURE",
        title: "signVerificationFail",
      });
      // This message is exactly what wallet-api forwards as `/swap/cancelled` errorMessage.
      expect(result?.message).toBe("Signature verification failed [diagnostic=device_mismatch]");
    });

    it("flags the firmware R/S-to-DER edge case when r has a leading zero byte", () => {
      const { payload, signature } = findDotPrefixedPayload(
        curve,
        "leading-zero-r-",
        compact => compact[0] === 0x00 && compact[32] !== 0x00,
      );

      const result = enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
      });

      expect(result?.message).toBe(
        "Signature verification failed [diagnostic=device_mismatch_leading_zero_r]",
      );
    });

    it("flags the firmware R/S-to-DER edge case when s has a leading zero byte", () => {
      const { payload, signature } = findDotPrefixedPayload(
        curve,
        "leading-zero-s-",
        compact => compact[32] === 0x00 && compact[0] !== 0x00,
      );

      const result = enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
      });

      expect(result?.message).toBe(
        "Signature verification failed [diagnostic=device_mismatch_leading_zero_s]",
      );
    });

    it("detects a backend that signed the payload without the JWS dot prefix", () => {
      const binaryPayload = base64url(Buffer.from("payload-without-dot"));
      // Signed over the base64url payload string itself (no leading ".").
      const signature = base64url(signCompact(curve, Buffer.from(binaryPayload)));

      const result = enrich({ binaryPayload, signature, curveName, curve });

      expect(result?.message).toBe(
        "Signature verification failed [diagnostic=backend_signed_without_dot_prefix]",
      );
    });

    it("detects a backend that signed the decoded protobuf bytes", () => {
      const rawProtobuf = Buffer.from("raw-protobuf-bytes");
      const binaryPayload = base64url(rawProtobuf);
      // Signed over the decoded bytes instead of the base64url string.
      const signature = base64url(signCompact(curve, rawProtobuf));

      const result = enrich({ binaryPayload, signature, curveName, curve });

      expect(result?.message).toBe(
        "Signature verification failed [diagnostic=backend_signed_raw_protobuf]",
      );
    });

    it("reports a genuine payload/signature mismatch when nothing verifies", () => {
      const binaryPayload = base64url(Buffer.from("expected-payload"));
      const signature = base64url(
        signCompact(curve, Buffer.from("a-completely-unrelated-message")),
      );

      const result = enrich({ binaryPayload, signature, curveName, curve });

      expect(result?.message).toBe(
        "Signature verification failed [diagnostic=signature_invalid_all_inputs]",
      );
    });

    it("falls back to the device error for a malformed (non 64-byte) signature", () => {
      const binaryPayload = base64url(Buffer.from("expected-payload"));
      const signature = base64url(Buffer.alloc(10));

      expect(enrich({ binaryPayload, signature, curveName, curve })).toBeUndefined();
    });
  });

  it("falls back to the device error for unrelated status codes", () => {
    const { curveName, curve } = curves[0];
    const { payload, signature } = findDotPrefixedPayload(curve, "unrelated-status-", () => true);

    expect(
      enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
        error: new TransportStatusError(ErrorStatus.INVALID_ADDRESS),
      }),
    ).toBeUndefined();
  });

  it("falls back to the device error outside the CHECK_TRANSACTION_SIGNATURE step", () => {
    const { curveName, curve } = curves[0];
    const { payload, signature } = findDotPrefixedPayload(curve, "wrong-step-", () => true);

    expect(
      enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
        step: "PROCESS_TRANSACTION",
      }),
    ).toBeUndefined();
  });

  it("falls back to the device error for the legacy (non-NG) swap flow", () => {
    const { curveName, curve } = curves[0];
    const { payload, signature } = findDotPrefixedPayload(curve, "legacy-flow-", () => true);

    expect(
      enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
        isSwapNg: false,
      }),
    ).toBeUndefined();
  });

  it("falls back to the device error when the partner public key is unavailable", () => {
    const { curve } = curves[0];
    const { payload, signature } = findDotPrefixedPayload(curve, "missing-key-", () => true);

    expect(
      enrichSwapSignatureVerificationError({
        step: "CHECK_TRANSACTION_SIGNATURE",
        isSwapNg: true,
        binaryPayload: payload,
        signature,
        publicKey: undefined,
        error: signVerificationFail,
      }),
    ).toBeUndefined();
  });

  it("falls back to the device error for non-transport errors", () => {
    const { curveName, curve } = curves[0];
    const { payload, signature } = findDotPrefixedPayload(curve, "non-transport-", () => true);

    expect(
      enrich({
        binaryPayload: payload,
        signature,
        curveName,
        curve,
        error: new Error("boom"),
      }),
    ).toBeUndefined();
  });
});
