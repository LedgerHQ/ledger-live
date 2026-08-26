// Base32 groups of five, as principals are written; the last group may be shorter. Three groups
// minimum, so ordinary hyphenated prose is left alone — a real principal is eleven.
const PRINCIPAL_TEXT = /\b[a-z2-7]{5}(?:-[a-z2-7]{5}){2,}(?:-[a-z2-7]{1,4})?\b/g;

/**
 * The text with any principal in it replaced by a placeholder.
 *
 * Rejection messages are quoted verbatim to the user and travel with the error into crash reporting,
 * and the governance canister writes the caller into several of them ("Caller <principal> is not
 * authorized to…", `neuron/types.rs`). A principal is derived from the account's public key, so it
 * identifies the account as an address does. What makes the message worth showing is the reason, not
 * who was refused, and the reader already knows they were the caller.
 */
export const redactPrincipals = (text: string): string => text.replace(PRINCIPAL_TEXT, "<hidden>");
