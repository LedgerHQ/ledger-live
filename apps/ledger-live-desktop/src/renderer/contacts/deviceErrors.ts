/**
 * DMK error helpers shared between the contacts boundary (`useContacts`)
 * and the L4 device-runner UI (`RunDeviceAction`).
 *
 * DMK rejects with tagged-object errors (not real `Error` instances), e.g.
 *
 *   { _tag: "EthAppCommandError", errorCode: "6982", message: "Security
 *     status not satisfied (Canceled by user)" }
 *
 * `JSON.stringify`-ing those gives a dev-y blob the user shouldn't see;
 * this helper extracts the human-readable message instead.
 */

import { CONTACT_SEED_MISMATCH_ERROR_CODE } from "@ledgerhq/device-management-kit";

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" ? (value as RecordLike) : null;

/**
 * DMK frequently formats errors as `<technical prefix> (<readable reason>)`,
 * e.g. `Security status not satisfied (Canceled by user)`. The prefix is
 * jargon the end-user can't act on; the parenthetical is the bit they
 * actually care about. When the whole message matches that shape we
 * surface only the parenthetical for display. Anything else is returned
 * unchanged.
 *
 * One additional rewrite: older DMK builds labelled many failures as
 * "Canceled by user" regardless of the real cause (Ethereum app version
 * too old to support contacts, locked session, PIN required, etc.). We've
 * observed false attributions in the field — users get told they canceled
 * when the device never even prompted them — so we replace that specific
 * reason with a neutral phrasing that doesn't blame the user. If it WAS a
 * real cancel, the new wording still reads correctly; if it wasn't, we no
 * longer lie.
 *
 * Note: the seed-mismatch case (`SW 6982`) is now caught earlier and
 * upgraded to a dedicated screen via {@link isSeedMismatchError}, so it no
 * longer reaches this pretty-printer. For the contacts address-book
 * commands the device returns `6982` *only* on a seed-binding failure
 * (genuine on-device rejection returns `6a80`), which is what makes that
 * dedicated detection unambiguous.
 */
const AMBIGUOUS_DECLINE_REASONS = [/^canceled by user$/i];
const NEUTRAL_DECLINE_MESSAGE = "Device didn't approve the action";

export const prettyDeviceErrorMessage = (raw: string): string => {
  const match = raw.match(/^[^()]+\(([^()]+)\)\s*$/);
  const reason = match ? match[1].trim() : raw.trim();
  return AMBIGUOUS_DECLINE_REASONS.some(re => re.test(reason))
    ? NEUTRAL_DECLINE_MESSAGE
    : reason;
};

/**
 * Best-effort extraction of a human-readable message from a thrown value.
 * Used to turn DMK's tagged-object errors into something we can stringify
 * for users (and pass through to a real `Error` for stack-trace plumbing).
 */
export const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  const rec = asRecord(err);
  if (rec && typeof rec.message === "string") return rec.message;
  try {
    const json = JSON.stringify(err);
    // `JSON.stringify(undefined)` returns `undefined` (the value, not
    // a string) — fall through to String() so we never return a
    // non-string from a function typed to return string.
    if (typeof json === "string") return json;
  } catch {
    // circular / non-serialisable — fall through to String().
  }
  return String(err);
};

/**
 * True when a thrown value is the device's seed-mismatch signal for an
 * address-book operation — i.e. the contact/address was registered under a
 * different seed than the one currently on the device, so its HMAC /
 * group-handle verification failed (`SW 0x6982`).
 *
 * DMK surfaces this as a typed `ContactsCommandError`; by the time it
 * reaches the UI, `useContacts`' `finalize()` has flattened it into a real
 * `Error` that copies `_tag` and `errorCode` (the class identity is lost,
 * so `instanceof` won't work — we match on the copied discriminators).
 *
 * We require *both* discriminators. The `_tag` says it came from an
 * address-book command (vs. some other DMK command that also happens to
 * return `6982`), and the `errorCode` singles out the seed-binding failure
 * within that family — *every* address-book error (rejection `6a80`,
 * address-book-full `6a84`, …) shares the `ContactsCommandError` tag, so the
 * tag alone can't, and `6982` is returned *only* for seed mismatches.
 */
export const isSeedMismatchError = (err: unknown): boolean => {
  const rec = asRecord(err);
  return (
    !!rec &&
    rec._tag === "ContactsCommandError" &&
    rec.errorCode === CONTACT_SEED_MISMATCH_ERROR_CODE
  );
};
