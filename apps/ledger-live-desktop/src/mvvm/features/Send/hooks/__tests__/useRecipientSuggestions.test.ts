import { buildRecipientSuggestions } from "../useRecipientSuggestions";
import type { ContactsWallet } from "~/renderer/contacts/types";

const wallet = (parts: Partial<ContactsWallet>): ContactsWallet => ({
  contacts: parts.contacts ?? {},
  accounts: parts.accounts ?? {},
});

describe("buildRecipientSuggestions", () => {
  it("returns no suggestions on empty query", () => {
    expect(buildRecipientSuggestions(wallet({}), "", 1)).toEqual([]);
    expect(buildRecipientSuggestions(wallet({}), "   ", 1)).toEqual([]);
  });

  it("returns no suggestions on empty wallet", () => {
    expect(buildRecipientSuggestions(wallet({}), "anything", 1)).toEqual([]);
  });

  it("filters by chainId — only entries on the active chain surface", () => {
    const w = wallet({
      contacts: {
        Alice: {
          name: "Alice",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [
            { scope: "main", addressHex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", hmacRestHex: "h", derivationPath: "44'/60'/0'/0/0", chainId: 1 },
            { scope: "main", addressHex: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", hmacRestHex: "h", derivationPath: "44'/60'/0'/0/0", chainId: 137 },
          ],
        },
      },
    });
    const out = buildRecipientSuggestions(w, "ali", 1);
    expect(out).toHaveLength(1);
    expect(out[0].addressHex).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("matches contact name as a case-insensitive prefix", () => {
    const w = wallet({
      contacts: {
        Bob: {
          name: "Bob",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: "cc".repeat(20), hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    expect(buildRecipientSuggestions(w, "BO", 1)).toHaveLength(1);
    expect(buildRecipientSuggestions(w, "X", 1)).toHaveLength(0);
  });

  it("matches address hex prefix with or without 0x", () => {
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
    expect(buildRecipientSuggestions(w, "dead", 1)).toHaveLength(1);
    expect(buildRecipientSuggestions(w, "0xdead", 1)).toHaveLength(1);
    expect(buildRecipientSuggestions(w, "deaf", 1)).toHaveLength(0);
  });

  it("prefers ledgerAccount over external for the same address (de-dup)", () => {
    const addr = "ee".repeat(20);
    const w = wallet({
      accounts: {
        MyLedger: {
          name: "MyLedger",
          derivationPath: "44'/60'/0'/0/0",
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
    const out = buildRecipientSuggestions(w, addr.slice(0, 4), 1);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("ledgerAccount");
    expect(out[0].name).toBe("MyLedger");
  });

  it("caps results at 5 suggestions", () => {
    const contacts: ContactsWallet["contacts"] = {};
    for (let i = 0; i < 10; i++) {
      contacts[`Contact${i}`] = {
        name: `Contact${i}`,
        groupHandleHex: "gh",
        hmacNameHex: "hn",
        entries: [
          {
            scope: "main",
            addressHex: i.toString().padStart(40, "0"),
            hmacRestHex: "h",
            derivationPath: "x",
            chainId: 1,
          },
        ],
      };
    }
    expect(buildRecipientSuggestions(wallet({ contacts }), "contact", 1)).toHaveLength(5);
  });

  it("outputs 0x-prefixed lowercased addresses regardless of storage casing", () => {
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
    const out = buildRecipientSuggestions(w, "mix", 1);
    expect(out[0].addressHex).toBe("0xaaaabbbbccccddddeeee0011223344556677889900");
  });

  it("returns no suggestions when query is a full 40-char address that matches a wallet entry exactly", () => {
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
    expect(buildRecipientSuggestions(w, `0x${addr}`, 1)).toEqual([]);
    expect(buildRecipientSuggestions(w, addr, 1)).toEqual([]);
    // mixed case input still hides
    expect(buildRecipientSuggestions(w, `0x${addr.toUpperCase()}`, 1)).toEqual([]);
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
    expect(buildRecipientSuggestions(w, `0x${unknown}`, 1)).toEqual([]);
  });

  it("returns ledger account before external when both match the same query", () => {
    const w = wallet({
      accounts: {
        MainWallet: {
          name: "MainWallet",
          derivationPath: "x",
          chainId: 1,
          addressHex: "11".repeat(20),
          hmacProofHex: "h",
        },
      },
      contacts: {
        Maybe: {
          name: "Maybe",
          groupHandleHex: "gh",
          hmacNameHex: "hn",
          entries: [{ scope: "main", addressHex: "22".repeat(20), hmacRestHex: "h", derivationPath: "x", chainId: 1 }],
        },
      },
    });
    const out = buildRecipientSuggestions(w, "m", 1);
    expect(out).toHaveLength(2);
    expect(out[0].kind).toBe("ledgerAccount");
    expect(out[1].kind).toBe("external");
  });
});
