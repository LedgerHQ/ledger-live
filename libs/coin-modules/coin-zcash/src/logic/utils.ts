import { isValidZcashAddress } from "./validateAddress";

/** Synchronous recipient-validity check used by the bridge (getTransactionStatus). */
export function isRecipientValid(recipient: string): boolean {
  return isValidZcashAddress(recipient);
}
