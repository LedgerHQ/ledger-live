// as the client side must implement platform, it's for LLD/LLM to set the platform version
// that way allows to be loosely coupled between common and lld/llm
// it's like we do for enabling coins.
// beware this must be set in the first import of the end project.
import invariant from "invariant";
let version = "";
export function getPlatformVersion() {
  invariant(version, "setPlatformVersion must be called before anything else.");
  return version;
}
export function setPlatformVersion(v: string) {
  version = v;
}
