import type { BIOMETRY_TYPE } from "react-native-keychain";

export type BiometricsKind = `${BIOMETRY_TYPE}`;

export type BiometricsAvailability =
  | Readonly<{ status: "available"; kind: BiometricsKind }>
  /** No hardware. */
  | Readonly<{ status: "unavailable" }>
  /** Hardware present, nothing enrolled. */
  | Readonly<{ status: "notEnrolled" }>
  | Readonly<{ status: "lockedOut" }>;

export type BiometricsPromptResult =
  | Readonly<{ status: "succeeded" }>
  /** Dismissed — must not count as a failed attempt. */
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "failed" }>
  | Readonly<{ status: "lockedOut" }>;
