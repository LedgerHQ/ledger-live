import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  initialAccountStakingState,
  type AccountStaking,
  type AccountStakingState,
} from "./schema";
import { mockAccountStaking, mockAccountStakingPosition } from "./schema.mock";
import { mockAccountStakingState } from "./slice.mock";
import reducer, {
  accountStakingSlice,
  selectAccountAssetStakingTotals,
  selectAccountStakingPositions,
  selectAccountStakingTotals,
} from "./slice";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const cosmos = CryptoOrTokenCurrencyIdSchema.parse("cosmos");
const token = CryptoOrTokenCurrencyIdSchema.parse("cosmos/ibc/token");
const none: AccountStaking = { positions: [] };

const common = { queryKey: "", requestId: "r", sourceId, append: false, readAt: 0 };

const read = (data: AccountStaking, { uuid = accountUUID, revision = 0 } = {}) =>
  accountDataReceived({ ...common, kind: "staking", accountUUID: uuid, data, revision });

const reduce = (...actions: ReturnType<typeof read>[]) =>
  actions.reduce<AccountStakingState>(accountStakingSlice.reducer, initialAccountStakingState);

describe("accountStakingSlice", () => {
  it("should start from the initial state", () => {
    expect(reducer(undefined, { type: "" })).toEqual(initialAccountStakingState);
  });

  it("should store the positions of the account", () => {
    expect(reduce(read(mockAccountStaking()))[accountUUID]).toEqual({
      revision: 0,
      staking: mockAccountStaking(),
    });
  });

  it("should replace the positions on a newer read", () => {
    expect(reduce(read(mockAccountStaking()), read(none))[accountUUID]?.staking).toEqual(none);
  });

  it("should keep the newer positions when an older answer arrives", () => {
    const state = reduce(read(none, { revision: 2 }), read(mockAccountStaking(), { revision: 1 }));
    expect(state[accountUUID]).toEqual({ revision: 2, staking: none });
  });

  it("should leave the other account unchanged", () => {
    const state = reduce(read(none, { uuid: otherAccountUUID }), read(mockAccountStaking()));
    expect(state[otherAccountUUID]?.staking).toEqual(none);
  });

  it.each(["__proto__", "constructor", "toString"])(
    "should skip an answer keyed by the inherited key %s",
    key => {
      const state = reducer(initialAccountStakingState, {
        type: "accountData/received",
        payload: { ...common, kind: "staking", accountUUID: key, data: none, revision: 0 },
      });
      expect(state).toEqual({});
    },
  );
});

const rootState = { accountStaking: mockAccountStakingState() };

describe("selectAccountStakingPositions", () => {
  it("should return the stored positions", () => {
    expect(selectAccountStakingPositions(rootState, accountUUID)).toEqual(
      mockAccountStaking().positions,
    );
  });

  it("should return undefined for an account not read", () => {
    expect(selectAccountStakingPositions(rootState, otherAccountUUID)).toBeUndefined();
  });
});

describe("selectAccountStakingTotals", () => {
  it("should sum each asset's positions per bucket", () => {
    const positions = [
      mockAccountStakingPosition({ id: "a", amount: "100", rewards: "1" }),
      mockAccountStakingPosition({ id: "b", state: "activating", amount: "20", rewards: "2" }),
      mockAccountStakingPosition({
        id: "c",
        state: "deactivating",
        amount: "5",
        rewards: undefined,
      }),
      mockAccountStakingPosition({
        id: "d",
        state: "withdrawable",
        amount: "3",
        rewards: undefined,
      }),
      mockAccountStakingPosition({ id: "e", state: "inactive", amount: "7", rewards: undefined }),
      mockAccountStakingPosition({ id: "f", assetId: token, amount: "9", rewards: "4" }),
    ];
    const state = {
      accountStaking: mockAccountStakingState({
        [accountUUID]: { revision: 0, staking: { positions } },
      }),
    };
    expect(selectAccountStakingTotals(state, accountUUID)).toEqual([
      { assetId: cosmos, staked: "120", unbonding: "5", withdrawable: "3", rewards: "3" },
      { assetId: token, staked: "9", unbonding: "0", withdrawable: "0", rewards: "4" },
    ]);
  });

  it("should return the same totals while the positions do not change", () => {
    expect(selectAccountStakingTotals(rootState, accountUUID)).toBe(
      selectAccountStakingTotals(rootState, accountUUID),
    );
  });

  it("should return no row for an account that does not stake", () => {
    const state = { accountStaking: { [accountUUID]: { revision: 0, staking: none } } };
    expect(selectAccountStakingTotals(state, accountUUID)).toEqual([]);
  });

  it("should return undefined for an account not read", () => {
    expect(selectAccountStakingTotals(rootState, otherAccountUUID)).toBeUndefined();
  });
});

describe("selectAccountAssetStakingTotals", () => {
  it("should return the totals of the asset", () => {
    expect(selectAccountAssetStakingTotals(rootState, accountUUID, cosmos)).toEqual({
      assetId: cosmos,
      staked: "1000000",
      unbonding: "250000",
      withdrawable: "0",
      rewards: "1500",
    });
  });

  it("should return zero totals for an asset without position", () => {
    expect(selectAccountAssetStakingTotals(rootState, accountUUID, token)).toEqual({
      assetId: token,
      staked: "0",
      unbonding: "0",
      withdrawable: "0",
      rewards: "0",
    });
  });

  it("should return undefined for an account not read", () => {
    expect(selectAccountAssetStakingTotals(rootState, otherAccountUUID, cosmos)).toBeUndefined();
  });
});
