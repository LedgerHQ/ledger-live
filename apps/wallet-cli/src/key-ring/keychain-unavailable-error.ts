// Reported as `keychain_unavailable` in the JSON error envelope. Kept out of the keychain modules so
// the output layer can check it without loading the native keyring module for every command.
export class KeychainUnavailableError extends Error {
  override name = "KeychainUnavailableError";
}
