import { BATCH_RATES_15, EXCHANGE_RATE_AT_EPOCH } from "./graphql/queries";
import type { StakedSuiJson } from "./graphql/utils";
import { type FakeValidator, makeSystemStateJson } from "./graphql/fixtures";

export type { FakeValidator } from "./graphql/fixtures";

/** Test-only convenience: replicates a single byte across all 32 address bytes. */
export const addr = (byte: string) => "0x" + byte.repeat(32);

/** One `Address.balances.nodes` row in wire shape. */
export const fakeBalance = (coinType: string, balance: string, addressBalance: string = "0") => ({
  coinType: { repr: coinType },
  totalBalance: balance,
  addressBalance,
});

/** Wire envelope for `ALL_BALANCES_BY_OWNER`; matches the response `getAllBalancesCachedGraphQL` parses. */
export function fakeBalancesPage(
  balances: ReadonlyArray<ReturnType<typeof fakeBalance>>,
  page: { hasNextPage?: boolean; endCursor?: string | null } = {},
) {
  return {
    data: {
      address: {
        balances: {
          pageInfo: { hasNextPage: page.hasNextPage ?? false, endCursor: page.endCursor ?? null },
          nodes: balances,
        },
      },
    },
  };
}

/** Subset of `SuiGraphQLClient` the dual-path tests stub. */
export type MockGraphQLClient = {
  query: jest.Mock;
};

/** Stub the next `new SuiGraphQLClient(...)` and return the stub for call-history assertions. */
export function bindMockNextGraphQLClient(ctorMock: jest.Mock) {
  return (impl: Partial<MockGraphQLClient> = {}): MockGraphQLClient => {
    const client: MockGraphQLClient = {
      query: impl.query ?? jest.fn(),
    };
    ctorMock.mockImplementationOnce(() => client);
    return client;
  };
}

/** Jest-native `Active` narrowing: failure shows up as a normal `expect` diff. */
export function expectActive<T extends { status: string }>(
  stake: T,
): asserts stake is Extract<T, { status: "Active" }> {
  expect(stake.status).toBe("Active");
}

/** GraphQL `epoch.systemState` envelope around the inner Move JSON. */
function fakeSystemState(epochId: string, validators: ReadonlyArray<FakeValidator>) {
  return {
    epochId,
    systemState: { json: makeSystemStateJson({ epoch: epochId, validators }) },
  };
}

/** All `STAKED_SUI_OBJECTS_BY_OWNER` (paginated) calls in order. */
export const stakeQueryCalls = (query: jest.Mock) =>
  query.mock.calls.filter(c => c[0]?.variables && "first" in c[0].variables);

/** All `BATCH_RATES_15` (15-aliased) calls in order. Identity-matched against the imported document. */
export const batchExchangeRateCalls = (query: jest.Mock) =>
  query.mock.calls.filter(c => c[0]?.query === BATCH_RATES_15);

/** All `EXCHANGE_RATE_AT_EPOCH` (single-query) calls in order. */
export const singleRateCalls = (query: jest.Mock) =>
  query.mock.calls.filter(c => c[0]?.query === EXCHANGE_RATE_AT_EPOCH);

/** Variables of every single-rate call, in invocation order. */
export const singleRateVars = (query: jest.Mock): Array<{ table: string; literal: string }> =>
  singleRateCalls(query).map(c => c[0].variables);

/** Neutral 1.0 ratio — use when a test needs a successful rate but doesn't care about value. */
export const IDENTITY_RATE = { sui: 1_000_000, pt: 1_000_000 } as const;

/** Aliased-batch response; pass `null` at an index to simulate the missing-rate degradation path. */
export function fakeBatchRateResponse(
  rates: Array<{ sui: number | string; pt: number | string } | null>,
) {
  const data: Record<string, unknown> = {};
  rates.forEach((r, i) => {
    data[`v${i}`] = r
      ? {
          dynamicField: {
            value: {
              __typename: "MoveValue",
              json: { sui_amount: String(r.sui), pool_token_amount: String(r.pt) },
            },
          },
        }
      : null;
  });
  return { data };
}

/** Shortcut for "n successful rate responses, all neutral 1.0 ratio." */
export const fakeUniformBatchRates = (n: number) =>
  fakeBatchRateResponse(Array.from({ length: n }, () => IDENTITY_RATE));

/** Single-query rate response; `null` simulates the missing-rate degradation path. */
export function fakeSingleRate(rate: { sui: number | string; pt: number | string } | null) {
  return {
    data: {
      address: rate
        ? {
            dynamicField: {
              value: {
                __typename: "MoveValue",
                json: { sui_amount: String(rate.sui), pool_token_amount: String(rate.pt) },
              },
            },
          }
        : null,
    },
  };
}

/** Shortcut: single-query response with the neutral 1.0 ratio. */
export const fakeUniformSingleRate = () => fakeSingleRate(IDENTITY_RATE);

/** Minimal `StakedSui` node — only `contents.json` is consumed by the mapper. */
export const fakeStakeNode = (json: StakedSuiJson) => ({ contents: { json } });

/** Build a `SUI_SYSTEM_STATE` query response in one call. */
export const fakeSystemStateQuery = (epoch: string, validators: ReadonlyArray<FakeValidator>) => ({
  data: { epoch: fakeSystemState(epoch, validators) },
});

/** Wraps stake nodes into a `STAKED_SUI_OBJECTS_BY_OWNER` page response. */
export function fakeStakesPage(
  nodes: ReadonlyArray<ReturnType<typeof fakeStakeNode>>,
  page: { hasNextPage?: boolean; endCursor?: string | null } = {},
) {
  return {
    data: {
      address: {
        objects: {
          pageInfo: { hasNextPage: page.hasNextPage ?? false, endCursor: page.endCursor ?? null },
          nodes,
        },
      },
    },
  };
}
