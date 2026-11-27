export class LegacyDeriveUnsupportedError extends Error {
  override name = "LegacyDeriveUnsupportedError";
}

export class MissingAccountCompletionError extends Error {
  override name = "MissingAccountCompletionError";
}

export class CompletionAccountMismatchError extends Error {
  override name = "CompletionAccountMismatchError";
}
