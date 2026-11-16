import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  CryptoOrTokenCurrencyIdSchema,
  type CryptoOrTokenCurrencyId,
} from "@domain/entity-currency";
import {
  initialAccountStatusState,
  type AccountStatus,
  type AccountStatusState,
  type AssetStatus,
} from "./schema";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";
import { mockAccountStatusState } from "./slice.mock";
import reducer, { accountStatusSlice, selectAccountStatus, selectAssetStatus } from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: { staked: string } };
  }
}

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const ethereum = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const usdc = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");
const onboarding = mockAccountStatus({ used: false, gate: { type: "onboarding" } });
const ready = mockAccountStatus();
const held = mockAssetStatus();
const trustline = mockAssetStatus({ gate: { type: "activation", method: "trustline" } });

const reduce = (...actions: Parameters<typeof accountStatusSlice.reducer>[1][]) =>
  actions.reduce<AccountStatusState>(accountStatusSlice.reducer, initialAccountStatusState);

const common = { queryKey: "", requestId: "r", sourceId, append: false, readAt: 0 };

const accountRead = (status: AccountStatus, { uuid = accountUUID, revision = 0 } = {}) =>
  accountDataReceived({
    ...common,
    kind: "accountStatus",
    accountUUID: uuid,
    data: status,
    revision,
  });

const assetRead = (
  status: AssetStatus,
  {
    assetId = ethereum,
    revision = 0,
  }: { assetId?: CryptoOrTokenCurrencyId; revision?: number } = {},
) =>
  accountDataReceived({
    ...common,
    kind: "assetStatus",
    accountUUID,
    data: { assetId, status },
    revision,
  });

describe("accountStatusSlice", () => {
  it("should start from the initial state", () => {
    expect(reducer(undefined, { type: "" })).toEqual(initialAccountStatusState);
  });

  it("should store the account status without any asset", () => {
    expect(reduce(accountRead(ready))[accountUUID]).toEqual({
      account: { revision: 0, status: ready },
      assets: {},
    });
  });

  it("should store an asset status without the account status", () => {
    expect(reduce(assetRead(trustline, { assetId: usdc }))[accountUUID]).toEqual({
      assets: { [usdc]: { revision: 0, status: trustline } },
    });
  });

  it("should keep the account status and each asset status apart", () => {
    const state = reduce(
      accountRead(ready),
      assetRead(held),
      assetRead(trustline, { assetId: usdc }),
    );
    expect(state[accountUUID]).toEqual({
      account: { revision: 0, status: ready },
      assets: {
        [ethereum]: { revision: 0, status: held },
        [usdc]: { revision: 0, status: trustline },
      },
    });
  });

  it("should replace the account status once the account is onboarded", () => {
    expect(
      reduce(accountRead(onboarding), accountRead(ready))[accountUUID]?.account?.status,
    ).toEqual(ready);
  });

  it("should keep the newer account status when an older answer arrives", () => {
    const state = reduce(
      accountRead(ready, { revision: 2 }),
      accountRead(onboarding, { revision: 1 }),
    );
    expect(state[accountUUID]?.account).toEqual({ revision: 2, status: ready });
  });

  it("should keep the newer asset status when an older answer arrives", () => {
    const state = reduce(assetRead(held, { revision: 2 }), assetRead(trustline, { revision: 1 }));
    expect(state[accountUUID]?.assets[ethereum]).toEqual({ revision: 2, status: held });
  });

  it("should guard the account and the assets with their own revisions", () => {
    const state = reduce(assetRead(held, { revision: 5 }), accountRead(ready, { revision: 1 }));
    expect(state[accountUUID]?.account).toEqual({ revision: 1, status: ready });
    expect(state[accountUUID]?.assets[ethereum]).toEqual({ revision: 5, status: held });
  });

  it("should leave the other account unchanged when one account is updated", () => {
    expect(
      reduce(accountRead(onboarding, { uuid: otherAccountUUID }), accountRead(ready))[
        otherAccountUUID
      ]?.account?.status,
    ).toEqual(onboarding);
  });

  it.each([
    { kind: "accountStatus", accountUUID: "__proto__", data: ready },
    {
      kind: "assetStatus",
      accountUUID: "constructor",
      data: { assetId: "ethereum", status: held },
    },
    { kind: "assetStatus", accountUUID, data: { assetId: "__proto__", status: held } },
    { kind: "accountStatus", accountUUID: "toString", data: ready },
    { kind: "assetStatus", accountUUID, data: { assetId: "hasOwnProperty", status: held } },
  ])("should skip an answer keyed by an inherited key: %o", payload => {
    const state = reducer(initialAccountStatusState, {
      type: "accountData/received",
      payload: { ...common, ...payload, revision: 0 },
    });
    expect(state).toEqual({});
    expect(Object.prototype).not.toHaveProperty("account");
  });

  it("should keep the stored statuses when another kind is received", () => {
    const state = reduce(
      accountRead(ready),
      accountDataReceived({
        ...common,
        kind: "staking",
        accountUUID,
        data: { staked: "1" },
        revision: 0,
      }),
    );
    expect(state[accountUUID]?.account?.status).toEqual(ready);
  });
});

const rootState = { accountStatus: mockAccountStatusState() };

describe("selectAccountStatus", () => {
  it("should return the stored status of the account", () => {
    expect(selectAccountStatus(rootState, accountUUID)).toEqual(mockAccountStatus());
  });

  it("should return undefined when only assets of the account were read", () => {
    const assetsOnly = { accountStatus: { [accountUUID]: { assets: {} } } };
    expect(selectAccountStatus(assetsOnly, accountUUID)).toBeUndefined();
  });

  it("should return undefined when the account has no stored status", () => {
    expect(selectAccountStatus(rootState, otherAccountUUID)).toBeUndefined();
  });
});

describe("selectAssetStatus", () => {
  it("should return the stored status of an asset of the account", () => {
    expect(selectAssetStatus(rootState, accountUUID, ethereum)).toEqual(mockAssetStatus());
  });

  it("should return undefined when the asset of the account has no stored status", () => {
    expect(selectAssetStatus(rootState, accountUUID, usdc)).toBeUndefined();
  });

  it("should return undefined when the account has no stored status", () => {
    expect(selectAssetStatus(rootState, otherAccountUUID, ethereum)).toBeUndefined();
  });
});
