// as the client side must implement the Wallet API, it's for LLD/LLM to set the Wallet API version
// that way allows to be loosely coupled between common and lld/llm
// it's like we do for enabling coins.
// beware this must be set in the first import of the end project.
import invariant from "invariant";

declare global {
  var __ledgerWalletAPIVersion: string | undefined;
}

export function getWalletAPIVersion(): string {
  invariant(globalThis.__ledgerWalletAPIVersion, "setWalletAPIVersion must be called before anything else.");
  return globalThis.__ledgerWalletAPIVersion;
}
export function setWalletAPIVersion(v: string): void {
  globalThis.__ledgerWalletAPIVersion = v;
}
