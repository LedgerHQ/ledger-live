import { isConfidentialError, type ConfidentialErrorCode } from "@ledgerhq/coin-evm/confidential";
import { DeviceRefusedError } from "./confidentialApi";

export type ConfidentialErrorKind =
  | "deviceRefused"
  | "permitExpired"
  | "permitChainMismatch"
  | "kmsContextRevoked"
  | "aclDenied"
  | "denylisted"
  | "serviceUnavailable"
  | "decryptionPending"
  | "unknown";

const ERROR_KIND_BY_CODE: Partial<Record<ConfidentialErrorCode, ConfidentialErrorKind>> = {
  PermitRequired: "permitExpired",
  PermitExpired: "permitExpired",
  PermitChainMismatch: "permitChainMismatch",
  KmsContextRevoked: "kmsContextRevoked",
  AclDenied: "aclDenied",
  Denylisted: "denylisted",
  Unavailable: "serviceUnavailable",
  OracleUnavailable: "serviceUnavailable",
  RelayerError: "serviceUnavailable",
};

// The relayer answers 503 "Ciphertext not ready for decryption on the gateway chain"
// (readiness_check_timed_out) while the coprocessors have not attested a new handle yet. It is
// retriable: the balance is being processed, not unreadable.
const NOT_READY = /not ready for decryption|readiness_check_timed_out/i;

// A ConfidentialError keeps the SDK error it wraps in `fields.cause`; other errors in `cause`.
function causeOf(error: Error): unknown {
  return isConfidentialError(error) ? (error.fields?.cause ?? error.cause) : error.cause;
}

function messagesOf(error: unknown): string[] {
  const messages: string[] = [];
  for (let current = error, depth = 0; current instanceof Error && depth < 4; depth++) {
    messages.push(current.message);
    current = causeOf(current);
  }
  return messages;
}

export const isDecryptionPending = (error: unknown): boolean =>
  isConfidentialError(error, "RelayerError") &&
  messagesOf(error).some(message => NOT_READY.test(message));

export function getConfidentialErrorKind(error: unknown): ConfidentialErrorKind {
  if (error instanceof DeviceRefusedError) return "deviceRefused";
  if (error instanceof Error && error.name === "UserRefusedOnDevice") return "deviceRefused";
  if (isDecryptionPending(error)) return "decryptionPending";
  if (isConfidentialError(error)) return ERROR_KIND_BY_CODE[error.code] ?? "unknown";
  return "unknown";
}
