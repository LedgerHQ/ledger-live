import {
  findAccountTokenEntry,
  getAccountListStatus,
  getListVerdict,
  isDecodedPltState,
  isPltRejectReason,
  readAccountTokenEntry,
  readAccountTokens,
  readPltState,
} from "./plt";
import type {
  PltAccountModuleState,
  PltAccountToken,
  PltModuleState,
  PltTokenAccountState,
} from "../types";

function accountToken(
  moduleState: PltAccountToken["token"]["tokenState"]["moduleState"],
  state?: PltTokenAccountState["state"],
): PltAccountToken {
  return {
    token: {
      tokenId: "PLT",
      tokenState: {
        tokenModuleRef: "ref",
        decimals: 2,
        totalSupply: { value: "1000", decimals: 2 },
        moduleState,
      },
    },
    tokenAccountState: {
      balance: { value: "500", decimals: 2 },
      ...(state === undefined ? {} : { state }),
    },
  };
}

describe("isDecodedPltState", () => {
  it("accepts a decoded object", () => {
    const state: PltModuleState = { allowList: true };
    expect(isDecodedPltState(state)).toBe(true);
  });

  it("rejects the hex-string fallback the node emits when the CBOR does not decode", () => {
    expect(isDecodedPltState<PltModuleState>("a1696a6c6c6f774c697374f5")).toBe(false);
  });

  it("rejects an absent state", () => {
    expect(isDecodedPltState<PltAccountModuleState>(undefined)).toBe(false);
  });

  it("accepts an empty object", () => {
    expect(isDecodedPltState<PltAccountModuleState>({})).toBe(true);
  });

  it("rejects an array", () => {
    expect(isDecodedPltState([] as unknown as PltModuleState)).toBe(false);
  });
});

describe("getAccountListStatus", () => {
  it("allows when the token declares no list", () => {
    expect(getAccountListStatus(accountToken({ name: "Token" }))).toBe("allowed");
  });

  it("allows an account absent from a deny list", () => {
    expect(getAccountListStatus(accountToken({ denyList: true }, {}))).toBe("allowed");
  });

  it("allows a deny-list token when the account has no state at all", () => {
    expect(getAccountListStatus(accountToken({ denyList: true }))).toBe("allowed");
  });

  it("blocks an account on a deny list", () => {
    expect(getAccountListStatus(accountToken({ denyList: true }, { denyList: true }))).toBe(
      "blocked",
    );
  });

  it("blocks an account absent from an allow list", () => {
    expect(getAccountListStatus(accountToken({ allowList: true }, {}))).toBe("blocked");
  });

  it("blocks an allow-list token when the account has no state, since membership requires a write", () => {
    expect(getAccountListStatus(accountToken({ allowList: true }))).toBe("blocked");
  });

  it("allows an account on an allow list", () => {
    expect(getAccountListStatus(accountToken({ allowList: true }, { allowList: true }))).toBe(
      "allowed",
    );
  });

  it("ignores an account-level flag the token does not declare", () => {
    expect(getAccountListStatus(accountToken({}, { denyList: true }))).toBe("allowed");
  });

  it("reports unknown when the module state is undecodable", () => {
    expect(getAccountListStatus(accountToken("a1", { denyList: true }))).toBe("unknown");
  });

  it("reports unknown when a listed token's account state is undecodable", () => {
    expect(getAccountListStatus(accountToken({ allowList: true }, "a1"))).toBe("unknown");
  });

  it("reports unknown for a deny-list token with an undecodable account state", () => {
    expect(getAccountListStatus(accountToken({ denyList: true }, "a1"))).toBe("unknown");
  });

  it("does not report unknown when the token declares no list, whatever the account state", () => {
    expect(getAccountListStatus(accountToken({}, "a1"))).toBe("allowed");
  });
});

const verdict = (moduleState: PltModuleState, entry?: PltAccountToken) =>
  getListVerdict(moduleState, entry);

describe("getListVerdict", () => {
  it("allows when the token declares no list", () => {
    expect(verdict({ name: "Token" }, accountToken({ name: "Token" }))).toBe("allowed");
  });

  it("names the deny list when the account is on it", () => {
    expect(verdict({ denyList: true }, accountToken({ denyList: true }, { denyList: true }))).toBe(
      "denied",
    );
  });

  it("names the allow list when the account is absent from it", () => {
    expect(verdict({ allowList: true }, accountToken({ allowList: true }, {}))).toBe("notAllowed");
  });

  it("allows an approved account on an allow-list token", () => {
    expect(
      verdict({ allowList: true }, accountToken({ allowList: true }, { allowList: true })),
    ).toBe("allowed");
  });

  // Both rules refuse it; the chain would too. Reporting the deny list is the
  // more specific of the two facts.
  it("prefers the deny list when both rules refuse the same account", () => {
    const both = { allowList: true, denyList: true };
    expect(verdict(both, accountToken(both, { allowList: false, denyList: true }))).toBe("denied");
  });

  describe("with no entry for the token", () => {
    it("refuses an allow-list token, because membership requires a write", () => {
      expect(verdict({ allowList: true })).toBe("notAllowed");
    });

    it("allows a deny-list token, which absence says nothing about", () => {
      expect(verdict({ denyList: true })).toBe("allowed");
    });

    it("allows a token that declares neither list", () => {
      expect(verdict({ name: "Token" })).toBe("allowed");
    });
  });

  it("reports unknown for an undecodable account state", () => {
    expect(verdict({ allowList: true }, accountToken({ allowList: true }, "a1"))).toBe("unknown");
  });

  it("reports unknown for a non-boolean flag in the account state", () => {
    const state = { denyList: "true" } as unknown as PltAccountModuleState;

    expect(verdict({ denyList: true }, accountToken({ denyList: true }, state))).toBe("unknown");
  });

  // The legitimate absence, which must keep its meaning: the proxy omits `state`
  // when the account has no module state, so there is no membership to find.
  it("still treats an absent `state` inside a present tokenAccountState as no membership", () => {
    expect(verdict({ denyList: true }, accountToken({ denyList: true }))).toBe("allowed");
  });
});

describe("readPltState", () => {
  it("reads a decoded state", () => {
    expect(readPltState<PltModuleState>({ allowList: true })).toEqual({ allowList: true });
  });

  it("rejects the hex the node falls back to when the CBOR does not decode", () => {
    expect(readPltState<PltModuleState>("a1696a6c6c6f774c697374f5")).toBeUndefined();
  });

  it("rejects an absent state", () => {
    expect(readPltState<PltModuleState>(undefined)).toBeUndefined();
  });

  // A non-boolean flag fails every `=== true` test downstream, which would read
  // as "no list is declared" and allow a transfer off state that never decoded.
  it.each([
    ["a string flag", { denyList: "true" }],
    ["a numeric flag", { allowList: 1 }],
    ["a null flag", { denyList: null }],
  ])("rejects %s", (_label, state) => {
    expect(readPltState(state as unknown as PltModuleState)).toBeUndefined();
  });

  it("accepts a state that declares no flags at all", () => {
    expect(readPltState<PltModuleState>({ name: "Token" })).toEqual({ name: "Token" });
  });
});

describe("readAccountTokenEntry", () => {
  it("reads a well-formed entry", () => {
    const entry = accountToken({ allowList: true });
    expect(readAccountTokenEntry(entry)).toBe(entry);
  });

  // An empty id is malformed rather than merely unmatched — the rule
  // `isUsableEntry` already applies on the sync path.
  it.each([
    ["a null entry", null],
    ["a string where an entry belongs", "nonsense"],
    ["an entry with no token", {}],
    ["an entry with no tokenId", { token: {}, tokenAccountState: {} }],
    ["an entry with an empty tokenId", { token: { tokenId: "" }, tokenAccountState: {} }],
    ["an entry with a non-string tokenId", { token: { tokenId: 7 }, tokenAccountState: {} }],
    ["an entry with no tokenAccountState", { token: { tokenId: "PLT" } }],
    [
      "an entry whose tokenAccountState is a string",
      { token: { tokenId: "PLT" }, tokenAccountState: "bad" },
    ],
  ])("rejects %s", (_label, value) => {
    expect(readAccountTokenEntry(value)).toBeUndefined();
  });
});

describe("readAccountTokens", () => {
  it("reads a list whose entries all read", () => {
    const entry = accountToken({ allowList: true });
    expect(readAccountTokens([entry])).toEqual([entry]);
  });

  it("reads an empty list as empty rather than unreadable", () => {
    expect(readAccountTokens([])).toEqual([]);
  });

  it.each([
    ["an absent list", undefined],
    ["a non-array list", {}],
  ])("rejects %s", (_label, value) => {
    expect(readAccountTokens(value)).toBeUndefined();
  });

  // The entry that failed to read could be the one being looked for, and not
  // finding an entry is what "not on this list" is inferred from — which under a
  // deny list means allowed.
  it("rejects the whole list when one entry does not read", () => {
    expect(readAccountTokens([accountToken({ allowList: true }), null])).toBeUndefined();
  });
});

describe("findAccountTokenEntry", () => {
  it("matches on the id the proxy nests under `token`", () => {
    const entry = accountToken({ allowList: true });
    expect(findAccountTokenEntry([entry], "PLT")).toBe(entry);
  });

  it("returns nothing when the account holds a different token", () => {
    expect(findAccountTokenEntry([accountToken({})], "OTHER")).toBeUndefined();
  });
});

describe("isPltRejectReason", () => {
  it("recognises NonExistentTokenId", () => {
    expect(isPltRejectReason({ tag: "NonExistentTokenId", contents: "PLT" })).toBe(true);
  });

  it("recognises TokenUpdateTransactionFailed", () => {
    expect(
      isPltRejectReason({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "PLT", type: "tokenBalanceInsufficient" },
      }),
    ).toBe(true);
  });

  it("rejects a non-PLT tag", () => {
    expect(isPltRejectReason({ tag: "InvalidAccountReference" })).toBe(false);
  });

  it("rejects an absent reason", () => {
    expect(isPltRejectReason(undefined)).toBe(false);
  });

  it("rejects NonExistentTokenId without a string payload", () => {
    expect(isPltRejectReason({ tag: "NonExistentTokenId" })).toBe(false);
    expect(isPltRejectReason({ tag: "NonExistentTokenId", contents: { tokenId: "PLT" } })).toBe(
      false,
    );
  });

  it("rejects TokenUpdateTransactionFailed without a module reject payload", () => {
    expect(isPltRejectReason({ tag: "TokenUpdateTransactionFailed" })).toBe(false);
    expect(isPltRejectReason({ tag: "TokenUpdateTransactionFailed", contents: "PLT" })).toBe(false);
    expect(isPltRejectReason({ tag: "TokenUpdateTransactionFailed", contents: null })).toBe(false);
  });

  it("rejects a module reject payload missing tokenId or type", () => {
    expect(
      isPltRejectReason({ tag: "TokenUpdateTransactionFailed", contents: { tokenId: "PLT" } }),
    ).toBe(false);
    expect(
      isPltRejectReason({
        tag: "TokenUpdateTransactionFailed",
        contents: { type: "tokenBalanceInsufficient" },
      }),
    ).toBe(false);
  });

  it("accepts a module reject payload carrying optional details", () => {
    expect(
      isPltRejectReason({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "PLT", type: "operationNotPermitted", details: "abcd" },
      }),
    ).toBe(true);
  });
});
