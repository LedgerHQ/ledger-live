import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import {
  classifySwapNgSignature,
  type SwapNgSignatureClassification,
} from "@ledgerhq/hw-app-exchange";
import { enrichSwapSignatureVerificationError } from "./completeExchange";

jest.mock("@ledgerhq/hw-app-exchange", () => ({
  ...jest.requireActual("@ledgerhq/hw-app-exchange"),
  classifySwapNgSignature: jest.fn(),
}));

const CASES: [SwapNgSignatureClassification, string | undefined][] = [
  ["valid", "device_mismatch"],
  ["valid_leading_zero_r", "device_mismatch_leading_zero_r"],
  ["valid_leading_zero_s", "device_mismatch_leading_zero_s"],
  ["valid_leading_zero_rs", "device_mismatch_leading_zero_rs"],
  ["signed_without_dot_prefix", "backend_signed_without_dot_prefix"],
  ["signed_raw_protobuf", "backend_signed_raw_protobuf"],
  ["invalid", "signature_invalid_all_inputs"],
  ["signature_malformed", undefined],
];

describe("enrichSwapSignatureVerificationError", () => {
  it.each(CASES)(
    "maps the %s signature classification to the %s diagnostic",
    (classification, diagnostic) => {
      jest.mocked(classifySwapNgSignature).mockReturnValue(classification);

      const enriched = enrichSwapSignatureVerificationError({
        step: "CHECK_TRANSACTION_SIGNATURE",
        isSwapNg: true,
        binaryPayload: "payload",
        signature: "signature",
        publicKey: { curve: "secp256k1", data: Buffer.alloc(65) },
        error: new TransportStatusError(ErrorStatus.SIGN_VERIFICATION_FAIL),
      });

      expect(enriched?.message).toBe(
        diagnostic ? `Signature verification failed [diagnostic=${diagnostic}]` : undefined,
      );
    },
  );
});
