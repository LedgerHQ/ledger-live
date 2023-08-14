import { v5 as uuidv5 } from "uuid";
import { AccountMetadata } from "./types";
import { UUIDV5_NAMESPACE } from "../../../constants";

export function getAccountId(accountMetadata: AccountMetadata) {
  return uuidv5(accountMetadata.id, UUIDV5_NAMESPACE);
}
