import type { Contact } from "~/renderer/contacts/types";

/**
 * Identifier used to find the pinned "me" entry in the local store and to
 * synthesize a placeholder one when the user hasn't created one yet.
 *
 * Matched case-insensitively against `Contact.name`. The page treats this
 * entry specially: always pinned at the top of the list and selected by
 * default.
 */
export const ME_CONTACT_NAME = "me";

/**
 * Suffix appended to the user's chosen name when renaming the protected
 * Me contact. We always re-apply this so the identity stays recognisable
 * after every rename ("Hugo" → "Hugo (Me)", "Bilson" → "Bilson (Me)" …),
 * and the suffix doubles as the durable Me-detector once the contact has
 * been promoted to canonical and the rename overlay has been cleared.
 */
export const ME_DISPLAY_SUFFIX = " (Me)";

/**
 * Display-time enrichment of `Contact`: carries a `colorKey` that the
 * `InitialsAvatar` hashes for its background colour. Computed once at
 * merge time so the colour stays stable across renames — see
 * `useManagementViewModel.mergedContacts` for the resolution order
 * (`groupHandleHex` → underlying key → name fallback).
 *
 * Optional so existing call sites that build raw `Contact` stubs
 * (tests, the legacy L1 panel) keep type-checking; `InitialsAvatar`
 * falls back to hashing `name` when the field is absent.
 */
export type DisplayContact = Contact & {
  colorKey?: string;
};

export type ContactGroup =
  | { kind: "pinned"; contacts: DisplayContact[] }
  | { kind: "letter"; letter: string; contacts: DisplayContact[] };

const MePlaceholder: DisplayContact = {
  name: ME_CONTACT_NAME,
  groupHandleHex: "",
  hmacNameHex: "",
  entries: [],
  // Stable across every Me rename / promotion — anchors the Me
  // avatar's palette index to a fixed seed.
  colorKey: ME_CONTACT_NAME,
};

/**
 * Single source of truth: "does this name represent the Me identity?".
 *
 * Two cases are equivalent for our purposes:
 *   1. The literal default placeholder name (`"me"`, case-insensitive)
 *      — used before the user has renamed Me at all.
 *   2. Any name ending with ` (Me)` — covers both the locally-renamed
 *      pre-promotion case AND the post-promotion canonical row, where
 *      the wallet key carries the suffix and we no longer have a
 *      rename-overlay pointer back to `"me"`.
 *
 * `AddContactDialog` rejects new contacts whose names end with the
 * suffix, so case (2) only ever fires for the actual Me row.
 */
export function isMeIdentity(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === ME_CONTACT_NAME) return true;
  return trimmed.endsWith(ME_DISPLAY_SUFFIX);
}

/**
 * Strip a trailing ` (Me)` so the EditContactDialog can pre-fill the
 * user-editable portion of the display name. Idempotent — chained
 * calls are safe.
 */
export function stripMeSuffix(name: string): string {
  return name.endsWith(ME_DISPLAY_SUFFIX)
    ? name.slice(0, -ME_DISPLAY_SUFFIX.length)
    : name;
}

/**
 * Re-apply the Me suffix to the user's typed name. We strip any
 * pre-existing suffix first so a defensive double-click on Edit
 * doesn't turn "Hugo (Me)" into "Hugo (Me) (Me)".
 */
export function applyMeSuffix(typed: string): string {
  return `${stripMeSuffix(typed.trim())}${ME_DISPLAY_SUFFIX}`;
}

const isMe = (c: Contact): boolean => isMeIdentity(c.name);

const matchesQuery = (name: string, query: string): boolean =>
  name.toLowerCase().includes(query);

/**
 * Returns the contacts grouped for display in the management page's list
 * pane.
 *
 * 1. Pinned "me" group always appears first when it survives the search
 *    filter (or always, when the query is empty).
 * 2. Remaining contacts are sorted case-insensitively by `name` and grouped
 *    by uppercase first letter.
 * 3. Empty letter buckets are omitted (matches the spec "we don't display
 *    this bar if we don't have a contact with this first letter").
 *
 * The pinned "me" row participates in the search filter — typing a query
 * that doesn't match "me" will hide it, same as any other row.
 */
export function groupContacts(
  // Accepts pre-enriched `DisplayContact` entries (the viewmodel attaches
  // a `colorKey`) as well as raw `Contact` records (tests, the legacy L1
  // panel). The optional `colorKey` flows through untouched — entries
  // without it just fall back to name-hashing in `InitialsAvatar`.
  contacts: Record<string, DisplayContact>,
  query: string,
): ContactGroup[] {
  const normalizedQuery = query.trim().toLowerCase();

  const list = Object.values(contacts);

  const existingMe = list.find(isMe);
  const meContact: DisplayContact = existingMe ?? MePlaceholder;

  const others = list.filter(c => !isMe(c));

  const groups: ContactGroup[] = [];

  if (!normalizedQuery || matchesQuery(meContact.name, normalizedQuery)) {
    groups.push({ kind: "pinned", contacts: [meContact] });
  }

  const filtered = normalizedQuery
    ? others.filter(c => matchesQuery(c.name, normalizedQuery))
    : others;

  const sorted = filtered
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

  const byLetter = new Map<string, DisplayContact[]>();
  for (const c of sorted) {
    const trimmed = c.name.trim();
    const letter = (trimmed.charAt(0) || "#").toUpperCase();
    const bucket = byLetter.get(letter);
    if (bucket) bucket.push(c);
    else byLetter.set(letter, [c]);
  }

  // `Map` insertion order is preserved; `sorted` already gives us
  // alphabetical letters, so iterating the Map here yields A → Z.
  for (const [letter, bucket] of byLetter) {
    groups.push({ kind: "letter", letter, contacts: bucket });
  }

  return groups;
}
