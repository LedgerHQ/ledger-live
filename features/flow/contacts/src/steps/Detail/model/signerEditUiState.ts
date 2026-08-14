export type SignerEditUiState = "closed" | "signer-open" | "signer-mismatch" | "edit-open";

export function resolveEditUiStateOnSignerMismatch(): SignerEditUiState {
  return "signer-mismatch";
}

export function resolveEditUiStateOnSignerMismatchCancel(): SignerEditUiState {
  return "closed";
}

export function resolveEditUiStateOnConnectDifferentDevice(): SignerEditUiState {
  return "signer-open";
}
