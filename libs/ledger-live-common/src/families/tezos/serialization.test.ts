import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import type { StakingPosition, TezosAccount, TezosAccountRaw } from "./types";

const ADDRESS = "tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq";
const DELEGATE = "tz1baker";

const positions: StakingPosition[] = [
  {
    uid: `delegation-${ADDRESS}`,
    address: ADDRESS,
    delegate: DELEGATE,
    state: "active",
    asset: { type: "native" },
    amount: new BigNumber("1234567890"),
    actions: [],
  },
  {
    uid: `stake-${ADDRESS}`,
    address: ADDRESS,
    delegate: DELEGATE,
    state: "active",
    asset: { type: "native" },
    amount: new BigNumber("9999999999999999999"),
    actions: [],
  },
  {
    uid: `unstaking-${ADDRESS}`,
    address: ADDRESS,
    delegate: DELEGATE,
    state: "deactivating",
    asset: { type: "native" },
    amount: new BigNumber("42"),
    actions: [],
  },
  {
    uid: `finalizable-${ADDRESS}`,
    address: ADDRESS,
    delegate: DELEGATE,
    state: "inactive",
    asset: { type: "native" },
    amount: new BigNumber("7"),
    actions: [],
  },
];

function makeAccount(positions: StakingPosition[]): TezosAccount {
  return { stakingPositions: positions } as unknown as TezosAccount;
}

describe("coin-tezos serialization", () => {
  test("assignToAccountRaw writes positions when present", () => {
    const account = makeAccount(positions);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    const persisted = (raw as TezosAccountRaw).stakingPositions;
    expect(persisted).toHaveLength(4);
    expect(persisted?.map(p => p.uid)).toEqual([
      `delegation-${ADDRESS}`,
      `stake-${ADDRESS}`,
      `unstaking-${ADDRESS}`,
      `finalizable-${ADDRESS}`,
    ]);
    expect(persisted?.[1].amount).toEqual("9999999999999999999");
  });

  test("assignToAccountRaw skips writing when positions array is empty", () => {
    const account = makeAccount([]);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    expect((raw as TezosAccountRaw).stakingPositions).toBeUndefined();
  });

  test("assignFromAccountRaw rehydrates positions and reconstructs native asset", () => {
    const raw = {
      stakingPositions: [
        {
          uid: `delegation-${ADDRESS}`,
          address: ADDRESS,
          delegate: DELEGATE,
          state: "active" as const,
          amount: "1234567890",
        },
        {
          uid: `unstaking-${ADDRESS}`,
          address: ADDRESS,
          state: "deactivating" as const,
          amount: "42",
        },
      ],
    } as unknown as AccountRaw;
    const account = {} as Account;
    assignFromAccountRaw(raw, account);
    const got = (account as TezosAccount).stakingPositions!;
    expect(got).toHaveLength(2);
    expect(got[0]).toEqual({
      uid: `delegation-${ADDRESS}`,
      address: ADDRESS,
      delegate: DELEGATE,
      state: "active",
      asset: { type: "native" },
      amount: new BigNumber("1234567890"),
      actions: [],
    });
    // Stake without delegate: delegate field is omitted, not set to undefined
    expect(got[1]).not.toHaveProperty("delegate");
    expect(got[1].amount).toEqual(new BigNumber("42"));
  });

  test("assignFromAccountRaw defaults to empty array when raw lacks the field", () => {
    const raw = {} as AccountRaw;
    const account = {} as Account;
    assignFromAccountRaw(raw, account);
    expect((account as TezosAccount).stakingPositions).toEqual([]);
  });

  test("round-trip preserves uid prefixes and bigint amounts exactly", () => {
    const account = makeAccount(positions);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    const restored = {} as Account;
    assignFromAccountRaw(raw, restored);
    expect((restored as TezosAccount).stakingPositions).toEqual(positions);
  });

  test("round-trips createdAt on unstake positions", () => {
    const withCreatedAt: StakingPosition[] = [
      {
        uid: "unstaking-42",
        address: ADDRESS,
        delegate: DELEGATE,
        state: "deactivating",
        asset: { type: "native" },
        amount: new BigNumber("123"),
        actions: [],
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
      },
      {
        uid: "finalizable-43",
        address: ADDRESS,
        delegate: DELEGATE,
        state: "inactive",
        asset: { type: "native" },
        amount: new BigNumber("45"),
        actions: [],
        createdAt: new Date("2026-04-25T12:34:56.789Z"),
      },
    ];
    const account = makeAccount(withCreatedAt);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    const persisted = (raw as TezosAccountRaw).stakingPositions;
    expect(persisted?.[0].createdAt).toBe("2026-05-01T00:00:00.000Z");
    expect(persisted?.[1].createdAt).toBe("2026-04-25T12:34:56.789Z");

    const restored = {} as Account;
    assignFromAccountRaw(raw, restored);
    expect((restored as TezosAccount).stakingPositions).toEqual(withCreatedAt);
  });

  test("omits createdAt when position has none (delegation/stake positions)", () => {
    const account = makeAccount([positions[0]]);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    const persisted = (raw as TezosAccountRaw).stakingPositions;
    expect(persisted?.[0]).not.toHaveProperty("createdAt");
  });

  test("omits createdAt on serialize when Date is invalid", () => {
    const broken: StakingPosition[] = [
      {
        uid: "unstaking-bad",
        address: ADDRESS,
        delegate: DELEGATE,
        state: "deactivating",
        asset: { type: "native" },
        amount: new BigNumber("1"),
        actions: [],
        createdAt: new Date("not-a-date"),
      },
    ];
    const account = makeAccount(broken);
    const raw = {} as AccountRaw;
    assignToAccountRaw(account as unknown as Account, raw);
    expect((raw as TezosAccountRaw).stakingPositions?.[0]).not.toHaveProperty("createdAt");
  });

  test("omits createdAt on restore when stored string is malformed", () => {
    const raw = {
      stakingPositions: [
        {
          uid: "unstaking-bad",
          address: ADDRESS,
          delegate: DELEGATE,
          state: "deactivating" as const,
          amount: "1",
          createdAt: "not-a-date",
        },
      ],
    } as unknown as AccountRaw;
    const account = {} as Account;
    assignFromAccountRaw(raw, account);
    expect((account as TezosAccount).stakingPositions![0]).not.toHaveProperty("createdAt");
  });
});
