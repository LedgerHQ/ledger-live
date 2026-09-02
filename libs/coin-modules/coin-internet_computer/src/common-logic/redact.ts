import { Principal } from "@dfinity/principal";

// Base32 groups of five, as principals are written; the last group may be shorter. Three groups
// minimum, so a short hyphenated token like `hot-key` is not even a candidate.
const PRINCIPAL_SHAPED = /\b[a-z2-7]{5}(?:-[a-z2-7]{5}){2,}(?:-[a-z2-7]{1,4})?\b/g;

/**
 * The shape alone does not identify a principal: base32 spans the whole alphabet, so three
 * hyphenated five-letter words — `total-stake-limit` — read as one and used to be hidden along with
 * the sentence around them. Parsing the candidate checks the CRC its text carries.
 *
 * The trade is deliberate: a principal the canister had mangled would now survive redaction, but the
 * canister formats them from the real type, while losing the reason is the failure users see.
 */
const isPrincipal = (candidate: string): boolean => {
  try {
    Principal.fromText(candidate);
    return true;
  } catch {
    return false;
  }
};

/**
 * The text with any principal in it replaced by a placeholder.
 *
 * Rejection messages are quoted verbatim to the user and travel with the error into crash reporting,
 * and the governance canister writes the caller into several of them ("Caller <principal> is not
 * authorized to…", `neuron/types.rs`). A principal is derived from the account's public key, so it
 * identifies the account as an address does. What makes the message worth showing is the reason, not
 * who was refused, and the reader already knows they were the caller.
 */
export const redactPrincipals = (text: string): string =>
  text.replace(PRINCIPAL_SHAPED, match => (isPrincipal(match) ? "<hidden>" : match));
