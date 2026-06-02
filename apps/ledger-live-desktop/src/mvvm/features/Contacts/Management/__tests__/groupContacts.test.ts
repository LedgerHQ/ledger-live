import type { Contact } from "~/renderer/contacts/types";
import {
  applyMeSuffix,
  groupContacts,
  isMeIdentity,
  ME_CONTACT_NAME,
  ME_DISPLAY_SUFFIX,
  stripMeSuffix,
} from "../utils/groupContacts";

const stub = (name: string, entryCount = 0): Contact => ({
  name,
  groupHandleHex: "",
  hmacNameHex: "",
  entries: Array.from({ length: entryCount }, (_, i) => ({
    scope: `s${i}`,
    addressHex: "0x" + "0".repeat(40),
    hmacRestHex: "",
    derivationPath: "44'/60'/0'/0/0",
    chainId: 1,
  })),
});

const asRecord = (contacts: Contact[]): Record<string, Contact> =>
  Object.fromEntries(contacts.map(c => [c.name, c]));

describe("groupContacts", () => {
  it("synthesizes a 'me' pinned group when no real 'me' contact exists", () => {
    const result = groupContacts(asRecord([]), "");

    expect(result).toEqual([
      {
        kind: "pinned",
        contacts: [
          {
            name: ME_CONTACT_NAME,
            groupHandleHex: "",
            hmacNameHex: "",
            entries: [],
            // Stable avatar seed baked into the placeholder so the Me
            // pastel never depends on the (changing) display name.
            colorKey: ME_CONTACT_NAME,
          },
        ],
      },
    ]);
  });

  it("uses the real 'me' contact when present (case-insensitive match)", () => {
    const me = stub("Me", 2);
    const result = groupContacts(asRecord([me]), "");

    expect(result[0]).toEqual({ kind: "pinned", contacts: [me] });
  });

  it("pins 'me' before alphabetical letter groups", () => {
    const result = groupContacts(
      asRecord([stub("Alice"), stub("Bob"), stub(ME_CONTACT_NAME)]),
      "",
    );

    expect(result.map(g => g.kind)).toEqual(["pinned", "letter", "letter"]);
    expect(result[0]).toMatchObject({ kind: "pinned" });
    expect(result[1]).toMatchObject({ kind: "letter", letter: "A" });
    expect(result[2]).toMatchObject({ kind: "letter", letter: "B" });
  });

  it("groups by uppercase first letter", () => {
    const result = groupContacts(
      asRecord([stub("alice"), stub("ANNIE"), stub("Bob")]),
      "",
    );
    const letterGroups = result.filter(g => g.kind === "letter");

    expect(letterGroups).toHaveLength(2);
    expect(letterGroups[0]).toMatchObject({ letter: "A" });
    expect(letterGroups[1]).toMatchObject({ letter: "B" });
  });

  it("sorts within a letter case-insensitively", () => {
    const result = groupContacts(
      asRecord([stub("alice"), stub("Aaron"), stub("ANNIE")]),
      "",
    );
    const aGroup = result.find(
      g => g.kind === "letter" && g.letter === "A",
    );

    expect(aGroup?.kind).toBe("letter");
    if (aGroup?.kind === "letter") {
      expect(aGroup.contacts.map(c => c.name)).toEqual([
        "Aaron",
        "alice",
        "ANNIE",
      ]);
    }
  });

  it("skips letters that have no surviving contacts after the filter", () => {
    const result = groupContacts(
      asRecord([stub("Alice"), stub("Bob"), stub("Carol")]),
      "ali",
    );
    const letters = result
      .filter(g => g.kind === "letter")
      .map(g => (g.kind === "letter" ? g.letter : ""));

    expect(letters).toEqual(["A"]);
  });

  it("filters by case-insensitive substring on the contact name", () => {
    const result = groupContacts(
      asRecord([stub("Alice"), stub("BOB"), stub("Carol")]),
      "OL",
    );
    const allContacts = result.flatMap(g => g.contacts.map(c => c.name));

    expect(allContacts).toEqual(["Carol"]);
  });

  it("filters the pinned 'me' row with the same query as the rest", () => {
    const result = groupContacts(
      asRecord([stub("Alice"), stub(ME_CONTACT_NAME)]),
      "ali",
    );

    expect(result.find(g => g.kind === "pinned")).toBeUndefined();
    expect(result.map(g => g.kind)).toEqual(["letter"]);
  });

  it("keeps the pinned 'me' row when the query matches it", () => {
    const result = groupContacts(
      asRecord([stub("Alice"), stub(ME_CONTACT_NAME)]),
      "m",
    );

    expect(result.find(g => g.kind === "pinned")).toBeDefined();
  });

  it("returns an empty array when filter removes everything (and the synthetic 'me' doesn't match)", () => {
    const result = groupContacts(asRecord([stub("Alice")]), "zzz");
    expect(result).toEqual([]);
  });

  it("still pins the Me row after promotion (canonical name carries the ' (Me)' suffix)", () => {
    // Post-promotion the wallet key is e.g. "Hugo (Me)" and there's no
    // rename overlay. The pinning helper has to recognise the suffix.
    const result = groupContacts(
      asRecord([stub("Alice"), stub("Hugo (Me)", 1), stub("Bob")]),
      "",
    );

    expect(result[0]).toMatchObject({
      kind: "pinned",
      contacts: [expect.objectContaining({ name: "Hugo (Me)" })],
    });
    expect(result.slice(1).map(g => g.kind)).toEqual(["letter", "letter"]);
  });
});

describe("isMeIdentity", () => {
  it("matches the default 'me' placeholder (case-insensitive, trimmed)", () => {
    expect(isMeIdentity("me")).toBe(true);
    expect(isMeIdentity("ME")).toBe(true);
    expect(isMeIdentity("  Me  ")).toBe(true);
  });

  it("matches any name ending with ' (Me)' (post-promotion / post-rename)", () => {
    expect(isMeIdentity("Hugo (Me)")).toBe(true);
    expect(isMeIdentity("Brian Bilson (Me)")).toBe(true);
  });

  it("does NOT match regular contacts", () => {
    expect(isMeIdentity("Alice")).toBe(false);
    expect(isMeIdentity("")).toBe(false);
    // No leading space before the parens → not the canonical suffix.
    expect(isMeIdentity("Hugo(Me)")).toBe(false);
  });
});

describe("applyMeSuffix / stripMeSuffix", () => {
  it("appends the ' (Me)' suffix to the user's chosen name", () => {
    expect(applyMeSuffix("Hugo")).toBe(`Hugo${ME_DISPLAY_SUFFIX}`);
  });

  it("is idempotent — applying twice still produces a single suffix", () => {
    expect(applyMeSuffix(applyMeSuffix("Hugo"))).toBe(`Hugo${ME_DISPLAY_SUFFIX}`);
  });

  it("trims whitespace before re-applying the suffix", () => {
    expect(applyMeSuffix("  Hugo  ")).toBe(`Hugo${ME_DISPLAY_SUFFIX}`);
  });

  it("strips the suffix when present, leaves the name alone otherwise", () => {
    expect(stripMeSuffix("Hugo (Me)")).toBe("Hugo");
    expect(stripMeSuffix("Hugo")).toBe("Hugo");
  });
});
