import { tokenNoticeFor, readOperationExtra } from "./bridge";
import type { ConcordiumTokenNotice, ConcordiumTokenResources } from "./bridge";
import {
  PLT_TOKEN_ID,
  createFixtureAccount,
  createFixtureTokenAccount,
  createFixtureTokenCurrency,
} from "../test/fixtures";
import { createFixtureConcordiumAccount, createFixtureResources } from "../bridge/bridge.fixture";

describe("tokenNoticeFor", () => {
  const tokenAccount = createFixtureTokenAccount();

  const parentStoring = (tokens: Record<string, ConcordiumTokenResources>) =>
    createFixtureConcordiumAccount({
      concordiumResources: createFixtureResources({ tokens }),
    });

  const parentHolding = (state: ConcordiumTokenResources) =>
    parentStoring({ [PLT_TOKEN_ID]: state });

  const verdicts: [string, ConcordiumTokenResources, ConcordiumTokenNotice][] = [
    ["paused", { transferStatus: "blocked", paused: true }, "paused"],
    ["notAllowed", { transferStatus: "notAllowed" }, "notAllowed"],
    ["denied", { transferStatus: "denied" }, "denied"],
    ["unknown", { transferStatus: "unknown" }, "unverified"],
    ["blocked", { transferStatus: "blocked" }, "notPermitted"],
  ];

  it.each(verdicts)("should report %s as the notice", (_label, state, expected) => {
    expect(tokenNoticeFor(tokenAccount, parentHolding(state))).toBe(expected);
  });

  // From a corrupted store or a newer app version. The cast is the point: the union excludes this value.
  it("should refuse an off-union verdict rather than read it as permission", () => {
    const offUnion = { transferStatus: "something-newer" } as unknown as ConcordiumTokenResources;

    expect(tokenNoticeFor(tokenAccount, parentHolding(offUnion))).toBe("notPermitted");
  });

  it("should report nothing when the issuer allows the account", () => {
    expect(
      tokenNoticeFor(tokenAccount, parentHolding({ transferStatus: "allowed" })),
    ).toBeUndefined();
  });

  // Both an explicit false and an absent flag mean not paused, hence the `=== true` read.
  it("should report nothing when the issuer declared transfers resumed", () => {
    expect(
      tokenNoticeFor(tokenAccount, parentHolding({ transferStatus: "allowed", paused: false })),
    ).toBeUndefined();
  });

  // `resolveTransferStatus` collapses pause to `"blocked"`, so sync cannot emit
  // this pair. Pinned because `validateTokenPolicy` reads pause first too.
  it("should lead with pause when a list also refuses the account", () => {
    const state: ConcordiumTokenResources = { transferStatus: "denied", paused: true };

    expect(tokenNoticeFor(tokenAccount, parentHolding(state))).toBe("paused");
  });

  it("should report unverified when the entry belongs to another token", () => {
    const other = createFixtureTokenAccount({
      token: createFixtureTokenCurrency({ contractAddress: "tUSDT" }),
    });

    expect(tokenNoticeFor(other, parentHolding({ transferStatus: "allowed" }))).toBe("unverified");
  });

  it("should report unverified when the token has no entry", () => {
    expect(tokenNoticeFor(tokenAccount, parentStoring({}))).toBe("unverified");
  });

  // An account synced before `tokens` existed.
  it("should report unverified when the parent carries no token map", () => {
    const parent = createFixtureConcordiumAccount({
      concordiumResources: createFixtureResources({}),
    });

    expect(tokenNoticeFor(tokenAccount, parent)).toBe("unverified");
  });

  // An account persisted before `concordiumResources` existed.
  it("should report unverified when the parent carries no resources", () => {
    expect(tokenNoticeFor(tokenAccount, createFixtureAccount())).toBe("unverified");
  });

  it("should report unverified when there is no parent", () => {
    expect(tokenNoticeFor(tokenAccount, null)).toBe("unverified");
  });

  it("should report nothing for an account that is not a token", () => {
    const parent = parentHolding({ transferStatus: "denied" });

    expect(tokenNoticeFor(createFixtureAccount(), parent)).toBeUndefined();
  });
});

describe("readOperationExtra", () => {
  it("should keep a memo and a cause it recognises", () => {
    expect(readOperationExtra({ memo: "invoice 41", pltRejectCode: "rejected" })).toEqual({
      memo: "invoice 41",
      pltRejectCode: "rejected",
    });
  });

  it.each([
    ["an empty memo", { memo: "" }],
    ["a non-string memo", { memo: 7 }],
    ["an object memo", { memo: { toString: () => "x" } }],
  ])("should drop %s", (_label, extra) => {
    expect(readOperationExtra(extra).memo).toBeUndefined();
  });

  it("should drop a cause outside the set", () => {
    expect(
      readOperationExtra({ pltRejectCode: "operationNotPermitted" }).pltRejectCode,
    ).toBeUndefined();
  });

  // Reached for an operation stored before this field existed, and for one whose
  // stored shape is not an object at all.
  it.each([
    ["absent", undefined],
    ["null", null],
    ["a string", "memo"],
    ["an array", []],
  ])("should return nothing when extra is %s", (_label, extra) => {
    expect(readOperationExtra(extra)).toEqual({});
  });

  // Omitted, not set undefined, per `exactOptionalPropertyTypes`.
  it("should omit absent fields rather than setting them undefined", () => {
    expect(Object.keys(readOperationExtra({ memo: "only a memo" }))).toEqual(["memo"]);
  });
});
