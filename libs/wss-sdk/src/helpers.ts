import { v5 as uuidv5 } from "uuid";
import { UUIDV5_NAMESPACE } from "./constants";

export function getUserIdForPrivateKey(key: Buffer): string {
  return uuidv5(key, UUIDV5_NAMESPACE);
}
