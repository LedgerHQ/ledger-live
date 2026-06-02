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
 * One additional rewrite: DMK labels every `SW 6982` failure as
 * "Canceled by user" regardless of the real cause (genuine user-cancel,
 * Ethereum app version too old to support contacts, locked session,
 * PIN required, etc.). We've observed false attributions in the field —
 * users get told they canceled when the device never even prompted them —
 * so we replace that specific reason with a neutral phrasing that
 * doesn't blame the user. If it WAS a real cancel, the new wording
 * still reads correctly; if it wasn't, we no longer lie.
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
