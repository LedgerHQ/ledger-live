/**
 * Tests for the GraphQL transport branch of `sdk.ts`.
 *
 * These cover the routing introduced as part of the JSON-RPC → GraphQL
 * migration (see PR1 of the 2026-07-31 sunset plan):
 *   - `isGraphQLEndpoint` URL detection
 *   - `getAllBalancesCached` taking the GraphQL path when `node.url` is a
 *     GraphQL endpoint, including pagination and SIP-58 field remapping
 *     (`addressBalance` → `fundsInAddressBalance`)
 *   - `getLastBlock` issuing the typed CHECKPOINT queries and producing the
 *     same shape the JSON-RPC path produces
 *   - `getCheckpoint(seqNumber)` happy path
 *   - `getCheckpoint(digest)` rejecting with a clear error
 *
 * The existing `sdk.test.ts` exercises the JSON-RPC branch and is kept
 * separate so the two clients' mocks don't collide.
 */
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import coinConfig from "../config";

const GRAPHQL_URL = "https://graphql.mainnet.sui.io/graphql";

type MockGraphQLClient = {
  query: jest.Mock;
  listBalances: jest.Mock;
};

// JSON-RPC stays mocked too so any leak (caller hitting JSON-RPC when it
// should hit GraphQL) fails loudly via `unexpectedJsonRpc`.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC client invoked on GraphQL test path");
});

jest.mock("@mysten/sui/graphql", () => ({
  SuiGraphQLClient: jest.fn(),
}));

jest.mock("@mysten/sui/jsonRpc", () => ({
  ...jest.requireActual("@mysten/sui/jsonRpc"),
  SuiJsonRpcClient: jest.fn().mockImplementation(() => ({
    getAllBalances: unexpectedJsonRpc,
    getCheckpoint: unexpectedJsonRpc,
    getLatestCheckpointSequenceNumber: unexpectedJsonRpc,
    getStakes: unexpectedJsonRpc,
    getLatestSuiSystemState: unexpectedJsonRpc,
    getValidatorsApy: unexpectedJsonRpc,
  })),
  getJsonRpcFullnodeUrl: jest.fn().mockReturnValue("https://mockapi.sui.io"),
}));

// Imports of the module under test must come AFTER `jest.mock` calls so the
// module sees the mocked clients.
// eslint-disable-next-line import/first
import {
  isGraphQLEndpoint,
  getAllBalancesCached,
  getLastBlock,
  getCheckpoint,
  getStakesRaw,
  getValidators,
} from "./sdk";

const SuiGraphQLClientMock = SuiGraphQLClient as unknown as jest.Mock;

/**
 * Set up the next `new SuiGraphQLClient(...)` call to return a stub with the
 * given method implementations. Returns the stub so assertions can read its
 * call history. Each test should call this exactly once before it triggers
 * the SDK code path.
 */
function mockNextGraphQLClient(impl: Partial<MockGraphQLClient> = {}): MockGraphQLClient {
  const client: MockGraphQLClient = {
    query: impl.query ?? jest.fn(),
    listBalances: impl.listBalances ?? jest.fn(),
  };
  SuiGraphQLClientMock.mockImplementationOnce(() => client);
  return client;
}

beforeEach(() => {
  SuiGraphQLClientMock.mockReset();
  unexpectedJsonRpc.mockClear();
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_URL },
    status: { type: "active" },
  }));
});

describe("isGraphQLEndpoint", () => {
  test.each([
    ["https://graphql.mainnet.sui.io/graphql", true],
    ["https://graphql.testnet.sui.io/graphql", true],
    ["https://graphql.example.com/graphql/", true],
    ["https://example.com/api/graphql?token=x", true],
    ["https://fullnode.mainnet.sui.io:443/", false],
    ["https://example.com/jsonrpc", false],
    ["", false],
  ])("isGraphQLEndpoint(%p) === %p", (url, expected) => {
    expect(isGraphQLEndpoint(url)).toBe(expected);
  });
});

describe("getAllBalancesCached on GraphQL transport", () => {
  test("calls listBalances and remaps addressBalance to fundsInAddressBalance", async () => {
    const client = mockNextGraphQLClient({
      listBalances: jest.fn().mockResolvedValueOnce({
        balances: [
          {
            coinType: "0x2::sui::SUI",
            balance: "1000000000",
            coinBalance: "600000000",
            addressBalance: "400000000",
          },
          {
            coinType: "0x9::usdc::USDC",
            balance: "500000",
            coinBalance: "500000",
            addressBalance: "0",
          },
        ],
        hasNextPage: false,
        cursor: null,
      }),
    });

    const owner = "0x" + "11".repeat(32);
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-1");

    expect(result).toEqual([
      {
        coinType: "0x2::sui::SUI",
        coinObjectCount: 0,
        totalBalance: "1000000000",
        lockedBalance: {},
        fundsInAddressBalance: "400000000",
      },
      {
        coinType: "0x9::usdc::USDC",
        coinObjectCount: 0,
        totalBalance: "500000",
        lockedBalance: {},
        fundsInAddressBalance: "0",
      },
    ]);
    expect(client.listBalances).toHaveBeenCalledTimes(1);
    expect(client.listBalances).toHaveBeenCalledWith({ owner, cursor: null });
    expect(unexpectedJsonRpc).not.toHaveBeenCalled();
  });

  test("paginates through BalanceConnection until hasNextPage is false", async () => {
    const listBalances = jest
      .fn()
      .mockResolvedValueOnce({
        balances: [
          { coinType: "0xA::a::A", balance: "1", coinBalance: "1", addressBalance: "0" },
        ],
        hasNextPage: true,
        cursor: "cursor1",
      })
      .mockResolvedValueOnce({
        balances: [
          { coinType: "0xB::b::B", balance: "2", coinBalance: "2", addressBalance: "0" },
        ],
        hasNextPage: false,
        cursor: null,
      });
    mockNextGraphQLClient({ listBalances });

    const owner = "0x" + "22".repeat(32);
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-pagination");

    expect(result).toHaveLength(2);
    expect(result.map(b => b.coinType)).toEqual(["0xA::a::A", "0xB::b::B"]);
    expect(listBalances).toHaveBeenCalledTimes(2);
    expect(listBalances).toHaveBeenNthCalledWith(1, { owner, cursor: null });
    expect(listBalances).toHaveBeenNthCalledWith(2, { owner, cursor: "cursor1" });
  });
});

describe("getLastBlock on GraphQL transport", () => {
  test("queries latest checkpoint then resolves digest+timestamp via sequence", async () => {
    const isoTimestamp = "2026-04-01T12:34:56.789Z";
    const query = jest
      .fn()
      // 1. LATEST_CHECKPOINT_SEQUENCE
      .mockResolvedValueOnce({
        data: { checkpoint: { sequenceNumber: "12345" } },
      })
      // 2. CHECKPOINT_BY_SEQUENCE
      .mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "AbCdEfDigestZ",
            sequenceNumber: "12345",
            timestamp: isoTimestamp,
            networkTotalTransactions: "1000",
            previousCheckpointDigest: null,
            epoch: { epochId: "42" },
          },
        },
      });
    mockNextGraphQLClient({ query });

    const result = await getLastBlock("sui-graphql-last-block");

    expect(result).toEqual({
      digest: "AbCdEfDigestZ",
      sequenceNumber: "12345",
      timestampMs: String(new Date(isoTimestamp).getTime()),
    });
    expect(query).toHaveBeenCalledTimes(2);
    // First call has no variables, second carries the sequenceNumber
    expect(query.mock.calls[1][0].variables).toEqual({ sequenceNumber: "12345" });
  });
});

describe("getCheckpoint on GraphQL transport", () => {
  test("sequence-number lookup happy path", async () => {
    const isoTimestamp = "2026-05-01T00:00:00.000Z";
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "DigestForSeq99",
          sequenceNumber: "99",
          timestamp: isoTimestamp,
          networkTotalTransactions: "1",
          previousCheckpointDigest: null,
          epoch: { epochId: "1" },
        },
      },
    });
    mockNextGraphQLClient({ query });

    const result = await getCheckpoint("99", "sui-graphql-checkpoint-1");

    expect(result.digest).toBe("DigestForSeq99");
    expect(result.sequenceNumber).toBe("99");
    expect(result.timestampMs).toBe(String(new Date(isoTimestamp).getTime()));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0].variables).toEqual({ sequenceNumber: "99" });
  });

  test("digest lookup throws a clear error on GraphQL endpoint", async () => {
    // 32-byte digest, base58-ish — anything non-numeric.
    const digest = "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt";
    await expect(getCheckpoint(digest, "sui-graphql-checkpoint-2")).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    // No GraphQL client should have been instantiated since the guard
    // throws before withGraphQLApi runs.
    expect(SuiGraphQLClientMock).not.toHaveBeenCalled();
  });

  test("propagates GraphQL errors with a descriptive message", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "Checkpoint out of available range" }],
    });
    mockNextGraphQLClient({ query });

    await expect(getCheckpoint("9999999", "sui-graphql-checkpoint-3")).rejects.toThrow(
      /Checkpoint out of available range/,
    );
  });
});

// ---- PR 1b: stakes + validators via SuiSystemState + StakedSui MoveValue ----

/**
 * Build a minimal `SuiSystemStateInnerV2` payload sufficient to drive the
 * stake-grouping logic. Every field the mapper reads is filled; everything
 * else is permitted to be missing because the mapper only touches the
 * documented subset.
 */
function fakeSystemState(epochId: string, validators: Array<{
  poolId: string;
  validatorAddress: string;
  name: string;
}>) {
  return {
    epochId,
    referenceGasPrice: "100",
    systemState: {
      json: {
        epoch: epochId,
        protocol_version: 1,
        system_state_version: 2,
        validators: {
          active_validators: validators.map(v => ({
            metadata: {
              sui_address: v.validatorAddress,
              protocol_pubkey_bytes: "",
              network_pubkey_bytes: "",
              worker_pubkey_bytes: "",
              proof_of_possession: "",
              name: v.name,
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
              activation_epoch: 0,
              deactivation_epoch: null,
              sui_balance: 1_000_000_000_000,
              rewards_pool: 50_000_000_000,
              pool_token_balance: 900_000_000_000,
              exchange_rates: { id: "0xrates", size: 100 },
              pending_stake: 0,
              pending_total_sui_withdraw: 0,
              pending_pool_token_withdraw: 0,
            },
            commission_rate: 500,
            next_epoch_stake: 0,
            next_epoch_gas_price: 800,
            next_epoch_commission_rate: 500,
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

describe("getStakesRaw on GraphQL transport", () => {
  test("groups StakedSui objects by pool, joins validator address from system state, and computes status", async () => {
    const owner = "0x" + "33".repeat(32);
    const POOL_A = "0xpoolA";
    const POOL_B = "0xpoolB";
    const VAL_A = "0xvalidatorA";
    const VAL_B = "0xvalidatorB";

    const query = jest
      .fn()
      // 1st call: SUI_SYSTEM_STATE (Promise.all order — both fire in parallel
      // but the system-state query is enqueued first in the test SDK)
      .mockResolvedValueOnce({
        data: {
          epoch: fakeSystemState("100", [
            { poolId: POOL_A, validatorAddress: VAL_A, name: "ValA" },
            { poolId: POOL_B, validatorAddress: VAL_B, name: "ValB" },
          ]),
        },
      })
      // 2nd call: STAKED_SUI_OBJECTS_BY_OWNER first page (and only page)
      .mockResolvedValueOnce({
        data: {
          address: {
            objects: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  address: "0xstk1",
                  version: "1",
                  digest: "d1",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xstk1",
                      pool_id: POOL_A,
                      stake_activation_epoch: "50", // < current 100 → Active
                      principal: "1000000000",
                    },
                  },
                },
                {
                  address: "0xstk2",
                  version: "1",
                  digest: "d2",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xstk2",
                      pool_id: POOL_A,
                      stake_activation_epoch: "60", // < current → Active, same pool as stk1
                      principal: "2000000000",
                    },
                  },
                },
                {
                  address: "0xstk3",
                  version: "1",
                  digest: "d3",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xstk3",
                      pool_id: POOL_B,
                      stake_activation_epoch: "200", // > current 100 → Pending
                      principal: "500000000",
                    },
                  },
                },
              ],
            },
          },
        },
      });
    mockNextGraphQLClient({ query });

    const result = await getStakesRaw(owner, "sui-graphql-stakes-1");

    // Two pools => two DelegatedStake groups.
    expect(result).toHaveLength(2);

    const poolA = result.find(d => d.stakingPool === POOL_A)!;
    const poolB = result.find(d => d.stakingPool === POOL_B)!;
    expect(poolA.validatorAddress).toBe(VAL_A);
    expect(poolB.validatorAddress).toBe(VAL_B);
    expect(poolA.stakes).toHaveLength(2);
    expect(poolB.stakes).toHaveLength(1);

    // Active stake — stk1
    const stk1 = poolA.stakes.find(s => s.stakedSuiId === "0xstk1")!;
    expect(stk1.status).toBe("Active");
    expect(stk1.principal).toBe("1000000000");
    expect(stk1.stakeActiveEpoch).toBe("50");
    expect(stk1.stakeRequestEpoch).toBe("49"); // active − 1
    if (stk1.status === "Active") {
      // PR 1b limitation: estimatedReward placeholder
      expect(stk1.estimatedReward).toBe("0");
    }

    // Pending stake — stk3
    const stk3 = poolB.stakes[0];
    expect(stk3.status).toBe("Pending");
    expect(stk3.principal).toBe("500000000");

    expect(unexpectedJsonRpc).not.toHaveBeenCalled();
  });

  test("paginates StakedSui object listings", async () => {
    const owner = "0x" + "44".repeat(32);
    const POOL = "0xpoolSingle";
    const VAL = "0xvalidatorSingle";

    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          epoch: fakeSystemState("10", [
            { poolId: POOL, validatorAddress: VAL, name: "Val" },
          ]),
        },
      })
      .mockResolvedValueOnce({
        data: {
          address: {
            objects: {
              pageInfo: { hasNextPage: true, endCursor: "p1" },
              nodes: [
                {
                  address: "0xa",
                  version: "1",
                  digest: "d",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xa",
                      pool_id: POOL,
                      stake_activation_epoch: "5",
                      principal: "1",
                    },
                  },
                },
              ],
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          address: {
            objects: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  address: "0xb",
                  version: "1",
                  digest: "d",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xb",
                      pool_id: POOL,
                      stake_activation_epoch: "5",
                      principal: "2",
                    },
                  },
                },
              ],
            },
          },
        },
      });
    mockNextGraphQLClient({ query });

    const result = await getStakesRaw(owner, "sui-graphql-stakes-pagination");
    expect(result).toHaveLength(1);
    expect(result[0].stakes).toHaveLength(2);
    // Second StakedSui page request should pass `after: "p1"`.
    const calls = query.mock.calls;
    expect(calls[2][0].variables).toEqual({ owner, first: 50, after: "p1" });
  });

  test("falls back to '<unknown>' validatorAddress when pool isn't in active_validators", async () => {
    const owner = "0x" + "55".repeat(32);
    const KNOWN_POOL = "0xpoolKnown";
    const ORPHAN_POOL = "0xpoolOrphan";

    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          epoch: fakeSystemState("100", [
            { poolId: KNOWN_POOL, validatorAddress: "0xknown", name: "Known" },
          ]),
        },
      })
      .mockResolvedValueOnce({
        data: {
          address: {
            objects: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  address: "0xstkOrphan",
                  version: "1",
                  digest: "d",
                  contents: {
                    type: { repr: "0x3::staking_pool::StakedSui" },
                    json: {
                      id: "0xstkOrphan",
                      pool_id: ORPHAN_POOL,
                      stake_activation_epoch: "50",
                      principal: "1000",
                    },
                  },
                },
              ],
            },
          },
        },
      });
    mockNextGraphQLClient({ query });

    const result = await getStakesRaw(owner, "sui-graphql-stakes-orphan");
    expect(result).toHaveLength(1);
    expect(result[0].validatorAddress).toBe("<unknown>");
    expect(result[0].stakingPool).toBe(ORPHAN_POOL);
  });
});

describe("getValidators on GraphQL transport", () => {
  test("maps active_validators to SuiValidatorSummary[] with apy=0 and converts numeric Move fields to strings", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        epoch: fakeSystemState("42", [
          { poolId: "0xp1", validatorAddress: "0xv1", name: "V1" },
          { poolId: "0xp2", validatorAddress: "0xv2", name: "V2" },
        ]),
      },
    });
    mockNextGraphQLClient({ query });

    const result = await getValidators("sui-graphql-validators-1");
    expect(result).toHaveLength(2);

    const v1 = result.find(v => v.suiAddress === "0xv1")!;
    expect(v1.name).toBe("V1");
    expect(v1.description).toBe("desc");
    expect(v1.imageUrl).toBe("https://logo");
    expect(v1.projectUrl).toBe("https://project");
    expect(typeof v1.commissionRate).toBe("string");
    expect(v1.commissionRate).toBe("500");
    expect(typeof v1.stakingPoolSuiBalance).toBe("string");
    expect(v1.stakingPoolSuiBalance).toBe("1000000000000");
    // PR 1b limitation: APY placeholder
    expect(v1.apy).toBe(0);
    // Confirms the mapper preserved exchange rate references for PR 1c usage.
    expect(v1.exchangeRatesId).toBe("0xrates");
    expect(v1.exchangeRatesSize).toBe("100");
  });
});
