export type SignerEditUiState = "closed" | "signer-open" | "edit-open";

export function resolveEditUiStateOnPress(isSignerRequired: boolean): SignerEditUiState {
  return isSignerRequired ? "signer-open" : "edit-open";
}

export function resolveEditUiStateOnSignerCancel(current: SignerEditUiState): SignerEditUiState {
  return current === "signer-open" ? "closed" : current;
}
