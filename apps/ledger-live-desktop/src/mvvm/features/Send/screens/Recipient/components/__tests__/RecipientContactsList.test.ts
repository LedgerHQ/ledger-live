import type { RecipientSuggestion } from "../../../../hooks/useRecipientSuggestions";
import { groupContactsByLetter } from "../RecipientContactsList";

const suggestion = (name: string): RecipientSuggestion => ({
  id: `external:${name}`,
  name,
  addressHex: "0xabc",
  addressKey: "abc",
  kind: "external",
});

describe("groupContactsByLetter", () => {
  it("sorts alphabetically and groups under first letters", () => {
    const groups = groupContactsByLetter([
      suggestion("Vincent"),
      suggestion("Benoit L"),
      suggestion("guillaume"),
      suggestion("Baptiste"),
    ]);

    expect(groups.map(g => g.letter)).toEqual(["B", "G", "V"]);
    expect(groups[0].items.map(i => i.name)).toEqual(["Baptiste", "Benoit L"]);
    expect(groups[1].items.map(i => i.name)).toEqual(["guillaume"]);
  });

  it("buckets non-letter names under #", () => {
    const groups = groupContactsByLetter([suggestion("0x Capital"), suggestion("Alice")]);
    expect(groups.map(g => g.letter)).toEqual(["#", "A"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupContactsByLetter([])).toEqual([]);
  });
});
