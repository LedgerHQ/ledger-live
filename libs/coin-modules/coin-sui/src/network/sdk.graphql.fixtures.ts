import { BATCH_RATES_15, EXCHANGE_RATE_AT_EPOCH } from "./graphql/queries";
import type { StakedSuiJson } from "./graphql/utils";

/** Test-only convenience: replicates a single byte across all 32 address bytes. */
export const addr = (byte: string) => "0x" + byte.repeat(32);

/**
 * One row of `Address.balances.nodes`. `coinBalance` is unused by `sdk.ts`
 * but mirrored from `balance` so fixtures look like real wire shapes.
 */
export const fakeBalance = (coinType: string, balance: string, addressBalance: string = "0") => ({
  coinType,
  balance,
  coinBalance: balance,
  addressBalance,
});

/** Subset of `SuiGraphQLClient` the dual-path tests stub. */
export type MockGraphQLClient = {
  query: jest.Mock;
  listBalances: jest.Mock;
};

/**
 * Stub the next `new SuiGraphQLClient(...)` call to return a client
 * with the given method implementations. Returns the stub so assertions
 * can read its call history.
 */
export function bindMockNextGraphQLClient(ctorMock: jest.Mock) {
  return (impl: Partial<MockGraphQLClient> = {}): MockGraphQLClient => {
    const client: MockGraphQLClient = {
      query: impl.query ?? jest.fn(),
      listBalances: impl.listBalances ?? jest.fn(),
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

/**
 * One validator entry. `poolId` drives grouping; everything else has a
 * sane default so tests only spell out fields they actually assert on.
 */
export type FakeValidator = {
  poolId: string;
  validatorAddress?: string;
  name?: string;
  suiBalance?: number | string;
  poolTokenBalance?: number | string;
  exchangeRatesId?: string;
  /** `null` deactivates a pool. */
  activationEpoch?: number | string | null;
  commissionRate?: number | string;
};

/**
 * Minimal `SuiSystemStateInnerV2` payload — every field the mapper
 * reads is filled, with sane defaults a test can override per-validator
 * via {@link FakeValidator}. Module-private; tests use {@link fakeSystemStateQuery}.
 */
function fakeSystemState(epochId: string, validators: ReadonlyArray<FakeValidator>) {
  return {
    epochId,
    systemState: {
      json: {
        epoch: epochId,
        protocol_version: 1,
        system_state_version: 2,
        validators: {
          active_validators: validators.map(v => ({
            metadata: {
              sui_address: v.validatorAddress ?? "0xv",
              protocol_pubkey_bytes: "",
              network_pubkey_bytes: "",
              worker_pubkey_bytes: "",
              proof_of_possession: "",
              name: v.name ?? "V",
              description: "desc",
              image_url: "https://logo",
              project_url: "https://project",
              net_address: "",
              p2p_address: "",
              primary_address: "",
              worker_address: "",
            },
            voting_power: 100,
            operation_cap_id: "0xcap",
            gas_price: 800,
            staking_pool: {
              id: v.poolId,
              activation_epoch: v.activationEpoch ?? 0,
              deactivation_epoch: null,
              sui_balance: v.suiBalance ?? 1_000_000_000_000,
              rewards_pool: 50_000_000_000,
              pool_token_balance: v.poolTokenBalance ?? 900_000_000_000,
              exchange_rates: { id: v.exchangeRatesId ?? "0xrates", size: 100 },
              pending_stake: 0,
              pending_total_sui_withdraw: 0,
              pending_pool_token_withdraw: 0,
            },
            commission_rate: v.commissionRate ?? 500,
            next_epoch_stake: 0,
            next_epoch_gas_price: 800,
            next_epoch_commission_rate: v.commissionRate ?? 500,
          })),
          total_stake: "0",
          pending_active_validators: null,
          pending_removals: null,
          staking_pool_mappings: { id: "0xmap", size: validators.length },
          inactive_validators: null,
          validator_candidates: null,
          at_risk_validators: null,
        },
        reference_gas_price: 100,
        epoch_start_timestamp_ms: 0,
      },
    },
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

/**
 * Fake aliased-batch response (`v0`, `v1`, …). Pass `null` at an index
 * to simulate "not found in the exchange-rates Move Table" — exercises
 * the graceful-degradation path.
 */
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

/**
 * Fake single-query response for {@link EXCHANGE_RATE_AT_EPOCH}.
 * `null` simulates "table has no entry at that epoch" (the graceful-
 * degradation path).
 */
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

/**
 * One `StakedSui` GraphQL node — only `contents.json` is consumed by
 * the mapper, so other Object fields are intentionally omitted.
 */
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
