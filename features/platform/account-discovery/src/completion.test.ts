import {
  AccountDescriptorSchema,
  accountDescriptorKey,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  completedDescriptors,
  completionStates,
  dropPending,
  failPending,
  isSettled,
  mergeCompletionStates,
  splitSelection,
  type AccountCompletionEvent,
} from "./completion";
import type { DiscoveredAccount } from "./discoverAccounts";

const descriptor = (network: string, key: string): AccountDescriptor =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network,
    key,
    path: "m/44h/0h/0h/0/0",
  });

const aleo1 = descriptor("aleo", "aleo1first");
const aleo2 = descriptor("aleo", "aleo1second");
const aleo3 = descriptor("aleo", "aleo1third");
const evm = descriptor("ethereum", "0xabc");
const completedAleo1 = { ...aleo1, key: "aleo1first.AViewKey1secret" };

const discovered = (account: AccountDescriptor) =>
  ({ descriptor: account, status: { used: true, gate: null } }) as unknown as DiscoveredAccount;

const needsCompletion = (account: AccountDescriptor) => account.network === "aleo";

const event = (
  source: AccountDescriptor,
  state: AccountCompletionEvent["state"],
): AccountCompletionEvent => ({ source, state });

describe("completionStates", () => {
  it("starts every selected account waiting", () => {
    const states = completionStates([aleo1, aleo2], []);
    expect([...states.values()]).toEqual([{ type: "waiting" }, { type: "waiting" }]);
  });

  it("keys each account on its source, whatever key the completed descriptor carries", () => {
    const states = completionStates(
      [aleo1, aleo2, aleo3],
      [
        event(aleo1, { type: "awaiting-approval" }),
        event(aleo1, { type: "completed", descriptor: completedAleo1 }),
        event(aleo2, { type: "awaiting-approval" }),
        event(aleo2, { type: "refused" }),
        event(aleo3, { type: "awaiting-approval" }),
      ],
    );
    expect(states).toEqual(
      new Map([
        [accountDescriptorKey(aleo1), { type: "completed", descriptor: completedAleo1 }],
        [accountDescriptorKey(aleo2), { type: "refused" }],
        [accountDescriptorKey(aleo3), { type: "awaiting-approval" }],
      ]),
    );
    expect(completedDescriptors(states)).toEqual([completedAleo1]);
  });

  it("fails only the accounts the batch had not settled, keeping the approved ones", () => {
    const error = new Error("app closed");
    const states = failPending(
      completionStates(
        [aleo1, aleo2, aleo3],
        [
          event(aleo1, { type: "completed", descriptor: completedAleo1 }),
          event(aleo2, { type: "awaiting-approval" }),
        ],
      ),
      error,
    );
    expect([...states.values()].map(state => state.type)).toEqual([
      "completed",
      "failed",
      "failed",
    ]);
    expect(completedDescriptors(states)).toEqual([completedAleo1]);
  });

  it("drops the pending accounts of a stopped batch", () => {
    const states = dropPending(
      completionStates([aleo1, aleo2], [event(aleo1, { type: "refused" })]),
    );
    expect([...states.values()]).toEqual([{ type: "refused" }]);
  });
});

describe("mergeCompletionStates", () => {
  it("lays a retry over the previous attempt, keeping what it settled", () => {
    const previous = completionStates(
      [aleo1, aleo2],
      [event(aleo1, { type: "completed", descriptor: completedAleo1 })],
    );
    const retry = completionStates([aleo1, aleo2], [event(aleo2, { type: "refused" })]);
    expect([...mergeCompletionStates(previous, retry).values()]).toEqual([
      { type: "completed", descriptor: completedAleo1 },
      { type: "refused" },
    ]);
  });
});

describe("isSettled", () => {
  it("holds completed and refused accounts out of a retry", () => {
    expect(isSettled({ type: "completed", descriptor: completedAleo1 })).toBe(true);
    expect(isSettled({ type: "refused" })).toBe(true);
  });

  it("prompts failed, pending and unknown accounts again", () => {
    expect(isSettled({ type: "failed", error: new Error("x") })).toBe(false);
    expect(isSettled({ type: "awaiting-approval" })).toBe(false);
    expect(isSettled(undefined)).toBe(false);
  });
});

describe("splitSelection", () => {
  it("sends nothing to completion for a selection without such family", () => {
    const { ready, needsComplete } = splitSelection([discovered(evm)], needsCompletion);
    expect(ready.map(account => account.descriptor)).toEqual([evm]);
    expect(needsComplete).toEqual([]);
  });

  it("splits a mixed selection, keeping its order", () => {
    const { ready, needsComplete } = splitSelection(
      [discovered(aleo1), discovered(evm), discovered(aleo2)],
      needsCompletion,
    );
    expect(ready.map(account => account.descriptor)).toEqual([evm]);
    expect(needsComplete.map(account => account.descriptor)).toEqual([aleo1, aleo2]);
  });
});
