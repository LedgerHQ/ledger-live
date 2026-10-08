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

export function getConfidentialErrorKind(error: unknown): ConfidentialErrorKind {
  if (error instanceof DeviceRefusedError) return "deviceRefused";
  if (error instanceof Error && error.name === "UserRefusedOnDevice") return "deviceRefused";
  if (isConfidentialError(error)) return ERROR_KIND_BY_CODE[error.code] ?? "unknown";
  return "unknown";
}
