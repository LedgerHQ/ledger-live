// as the client side must implement the Wallet API, it's for LLD/LLM to set the Wallet API version
// that way allows to be loosely coupled between common and lld/llm
// it's like we do for enabling coins.
// beware this must be set in the first import of the end project.
import invariant from "invariant";
let version = "";
export function getWalletAPIVersion(): string {
  invariant(version, "setWalletAPIVersion must be called before anything else.");
  return version;
}
export function setWalletAPIVersion(v: string): void {
  version = v;
}
