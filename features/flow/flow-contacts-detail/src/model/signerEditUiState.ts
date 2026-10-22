export type SignerEditUiState = "closed" | "signer-mismatch" | "edit-open";

export function resolveEditUiStateOnSignerMismatch(): SignerEditUiState {
  return "signer-mismatch";
}

export function resolveEditUiStateOnSignerMismatchCancel(): SignerEditUiState {
  return "edit-open";
}

export function resolveEditUiStateOnConnectDifferentDevice(): SignerEditUiState {
  return "edit-open";
}
