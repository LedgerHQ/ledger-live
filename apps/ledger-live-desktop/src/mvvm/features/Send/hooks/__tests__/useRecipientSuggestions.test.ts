import { buildRecipientSuggestionGroups } from "../useRecipientSuggestions";
import type { ContactsWallet } from "~/renderer/contacts/types";

const wallet = (parts: Partial<ContactsWallet>): ContactsWallet => ({
  contacts: parts.contacts ?? {},
  accounts: parts.accounts ?? {},
});

describe("buildRecipientSuggestionGroups", () => {
  it("returns empty groups on empty wallet", () => {
    const out = buildRecipientSuggestionGroups(wallet({}), "", 1);
    expect(out.ledgerAccounts).toEqual([]);
    expect(out.external).toEqual([]);
    expect(out.hasQuery).toBe(false);
  });

  it("returns full inventory on empty query (browse mode)", () => {
    const w = wallet({
      accounts: {
        Alice: {
          name: "Alice",
          derivationPath: "x",
          chainId: 1,
          addressHex: "aa".repeat(20),
          hmacProofHex: "h",
        },
      },
      contacts: {
        Bob: {
          name: "Bob",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [
            {
              scope: "main",
              addressHex: "bb".repeat(20),
              hmacRestHex: "h",
              derivationPath: "x",
              chainId: 1,
            },
          ],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, "", 1);
    expect(out.hasQuery).toBe(false);
    expect(out.ledgerAccounts).toHaveLength(1);
    expect(out.ledgerAccounts[0].name).toBe("Alice");
    expect(out.external).toHaveLength(1);
    expect(out.external[0].name).toBe("Bob");
  });

  it("filters both groups by chainId", () => {
    const w = wallet({
      accounts: {
        OnChain1: {
          name: "OnChain1",
          derivationPath: "x",
          chainId: 1,
          addressHex: "aa".repeat(20),
          hmacProofHex: "h",
        },
        OnChain137: {
          name: "OnChain137",
          derivationPath: "x",
          chainId: 137,
          addressHex: "bb".repeat(20),
          hmacProofHex: "h",
        },
      },
    });
    expect(buildRecipientSuggestionGroups(w, "", 1).ledgerAccounts).toHaveLength(1);
    expect(buildRecipientSuggestionGroups(w, "", 137).ledgerAccounts).toHaveLength(1);
    expect(buildRecipientSuggestionGroups(w, "", 56).ledgerAccounts).toHaveLength(0);
  });

  it("filters by case-insensitive name prefix when hasQuery", () => {
    const w = wallet({
      contacts: {
        Alice: {
          name: "Alice",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [
            { scope: "main", addressHex: "aa".repeat(20), hmacRestHex: "h", derivationPath: "x", chainId: 1 },
          ],
        },
        Bob: {
          name: "Bob",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [
            { scope: "main", addressHex: "bb".repeat(20), hmacRestHex: "h", derivationPath: "x", chainId: 1 },
          ],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, "AL", 1);
    expect(out.hasQuery).toBe(true);
    expect(out.external).toHaveLength(1);
    expect(out.external[0].name).toBe("Alice");
  });

  it("filters by address hex prefix with or without 0x", () => {
    const addr = "deadbeef".padEnd(40, "0");
    const w = wallet({
      contacts: {
        Carol: {
          name: "Carol",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: addr, hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    expect(buildRecipientSuggestionGroups(w, "dead", 1).external).toHaveLength(1);
    expect(buildRecipientSuggestionGroups(w, "0xdead", 1).external).toHaveLength(1);
    expect(buildRecipientSuggestionGroups(w, "deaf", 1).external).toHaveLength(0);
  });

  it("prefers ledger account over external for the same address (dedup)", () => {
    const addr = "ee".repeat(20);
    const w = wallet({
      accounts: {
        MyLedger: {
          name: "MyLedger",
          derivationPath: "x",
          chainId: 1,
          addressHex: addr,
          hmacProofHex: "h",
        },
      },
      contacts: {
        SameAddress: {
          name: "SameAddress",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: addr, hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, "", 1);
    expect(out.ledgerAccounts).toHaveLength(1);
    expect(out.ledgerAccounts[0].name).toBe("MyLedger");
    expect(out.external).toHaveLength(0);
  });

  it("folds the picker when query is a full 40-char address matching an entry", () => {
    const addr = "deadbeef".padEnd(40, "0");
    const w = wallet({
      contacts: {
        Carol: {
          name: "Carol",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: addr, hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, `0x${addr}`, 1);
    expect(out.ledgerAccounts).toEqual([]);
    expect(out.external).toEqual([]);
    expect(out.hasQuery).toBe(true);
  });

  it("still surfaces suggestions for a full 40-char address that does NOT match any entry", () => {
    const stored = "aa".repeat(20);
    const unknown = "ff".repeat(20);
    const w = wallet({
      contacts: {
        Carol: {
          name: "Carol",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: stored, hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, `0x${unknown}`, 1);
    expect(out.ledgerAccounts).toEqual([]);
    expect(out.external).toEqual([]);
  });

  it("outputs 0x-prefixed lowercased addressHex regardless of storage casing", () => {
    const w = wallet({
      contacts: {
        Mixed: {
          name: "Mixed",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [
            {
              scope: "main",
              addressHex: "AAaaBBbbCCccDDddEEee0011223344556677889900",
              hmacRestHex: "h",
              derivationPath: "x",
              chainId: 1,
            },
          ],
        },
      },
    });
    const out = buildRecipientSuggestionGroups(w, "", 1);
    expect(out.external[0].addressHex).toBe("0xaaaabbbbccccddddeeee0011223344556677889900");
  });
});
