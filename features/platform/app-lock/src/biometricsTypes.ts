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

export type BiometricsPromptLabels = Readonly<{
  reason: string;
  /** iOS fallback title, and the Android negative button below API 30. */
  fallback: string;
  cancel: string;
}>;
