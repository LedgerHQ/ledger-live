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

export type ContactGroup =
  | { kind: "pinned"; contacts: Contact[] }
  | { kind: "letter"; letter: string; contacts: Contact[] };

const MePlaceholder: Contact = {
  name: ME_CONTACT_NAME,
  groupHandleHex: "",
  hmacNameHex: "",
  entries: [],
};

const isMe = (c: Contact): boolean =>
  c.name.trim().toLowerCase() === ME_CONTACT_NAME;

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
  contacts: Record<string, Contact>,
  query: string,
): ContactGroup[] {
  const normalizedQuery = query.trim().toLowerCase();

  const list = Object.values(contacts);

  const existingMe = list.find(isMe);
  const meContact: Contact = existingMe ?? MePlaceholder;

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

  const byLetter = new Map<string, Contact[]>();
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
