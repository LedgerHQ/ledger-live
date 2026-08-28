import { getAccountListStatus, isDecodedPltState, isPltRejectReason } from "./plt";
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
