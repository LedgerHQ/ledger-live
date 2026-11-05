import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  initialAccountReceivesState,
  type AccountReceive,
  type AccountReceivesState,
} from "./schema";
import { mockAccountReceive } from "./schema.mock";
import { accountReceivesSlice } from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: { staked: string } };
  }
}

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const ethereum = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const usdc = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");
const onboarding: AccountReceive = { status: "onboardingRequired" };
const activation: AccountReceive = { status: "assetActivationRequired" };
const ready = mockAccountReceive({ address: "ldg::1220ab" });

const reduce = (...actions: Parameters<typeof accountReceivesSlice.reducer>[1][]) =>
  actions.reduce<AccountReceivesState>(accountReceivesSlice.reducer, initialAccountReceivesState);

const receive = (
  data: AccountReceive,
  { uuid = accountUUID, assetId = ethereum, revision = 0 } = {},
) =>
  accountDataReceived({
    kind: "receive",
    accountUUID: uuid,
    queryKey: "",
    requestId: "r",
    data: { assetId, receive: data },
    sourceId,
    append: false,
    readAt: 0,
    revision,
  });

describe("accountReceivesSlice", () => {
  it("should store the receive of a read under its asset", () => {
    expect(reduce(receive(ready))[accountUUID]?.[ethereum]).toEqual({
      revision: 0,
      receive: ready,
    });
  });

  it("should replace the previous receive once the account is onboarded", () => {
    expect(reduce(receive(onboarding), receive(ready))[accountUUID]?.[ethereum]?.receive).toEqual(
      ready,
    );
  });

  it("should keep the receive of each asset apart", () => {
    const state = reduce(receive(ready), receive(activation, { assetId: usdc }));
    expect(state[accountUUID]?.[ethereum]?.receive).toEqual(ready);
    expect(state[accountUUID]?.[usdc]?.receive).toEqual(activation);
  });

  it("should keep the newer receive when an older answer for the same asset arrives", () => {
    const state = reduce(receive(ready, { revision: 2 }), receive(onboarding, { revision: 1 }));
    expect(state[accountUUID]?.[ethereum]).toEqual({ revision: 2, receive: ready });
  });

  it("should leave the other account unchanged when one account is updated", () => {
    expect(
      reduce(receive(onboarding, { uuid: otherAccountUUID }), receive(ready))[otherAccountUUID]?.[
        ethereum
      ]?.receive,
    ).toEqual(onboarding);
  });

  it("should keep the stored receive when another kind is received", () => {
    const state = reduce(
      receive(ready),
      accountDataReceived({
        kind: "staking",
        accountUUID,
        queryKey: "",
        requestId: "r",
        data: { staked: "1" },
        sourceId,
        append: false,
        readAt: 0,
        revision: 0,
      }),
    );
    expect(state[accountUUID]?.[ethereum]?.receive).toEqual(ready);
  });
});
