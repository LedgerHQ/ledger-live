export type ContactSignerId = string;

export const CONTACT_SIGNER_MISMATCH_ERROR = "signer_mismatch" as const;

export type ContactSignerValidationStatus = "valid" | typeof CONTACT_SIGNER_MISMATCH_ERROR;

export function resolveContactSignerValidationResult(
  expectedSignerId: ContactSignerId | null | undefined,
  currentSignerId: ContactSignerId | null | undefined,
): ContactSignerValidationStatus {
  if (expectedSignerId == null || currentSignerId == null) {
    return CONTACT_SIGNER_MISMATCH_ERROR;
  }

  return expectedSignerId === currentSignerId ? "valid" : CONTACT_SIGNER_MISMATCH_ERROR;
}
