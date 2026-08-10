export type SignerEditUiState = "closed" | "signer-open" | "signer-mismatch" | "edit-open";

export function resolveEditUiStateOnPress(isSignerRequired: boolean): SignerEditUiState {
  return isSignerRequired ? "signer-open" : "edit-open";
}

export function resolveEditUiStateOnSignerCancel(current: SignerEditUiState): SignerEditUiState {
  return current === "signer-open" ? "closed" : current;
}

export function resolveEditUiStateOnSignerMismatch(): SignerEditUiState {
  return "signer-mismatch";
}

export function resolveEditUiStateOnSignerMismatchCancel(): SignerEditUiState {
  return "closed";
}

export function resolveEditUiStateOnConnectDifferentDevice(): SignerEditUiState {
  return "signer-open";
}
