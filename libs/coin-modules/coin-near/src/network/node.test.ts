import { getNetworkState } from "@ledgerhq/live-network";
import { http, HttpResponse } from "msw";
import BigNumber from "bignumber.js";
import * as nearAPI from "near-api-js";
import { setCoinConfig } from "../config";
import { mockNearConfig } from "../test/context";
import {
  broadcastTransaction,
  getAccount,
  getAccountStateFingerprint,
  getGasPrice,
  getStakingPositions,
  getValidators,
} from "./node";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";
import { getActionCosts } from "./protocolConfig";

const RPC_GAS_PRICE = "123000000";
const ADDRESS = "delegator.near";
const VALIDATOR_ID = "astro-stakers.poolv1.near";

const runtimeConfig = (storageAmountPerByte: string) => ({
  storage_amount_per_byte: storageAmountPerByte,
  transaction_costs: {
    action_creation_config: {
      add_key_cost: { full_access_cost: { execution: 101765125000, send_not_sir: 101765125000 } },
      create_account_cost: { execution: 99607375000, send_not_sir: 99607375000 },
      transfer_cost: { execution: 115123062500, send_not_sir: 115123062500 },
    },
    action_receipt_creation_config: { execution: 108059500000, send_not_sir: 108059500000 },
  },
});

type IndexerValidator = {
  account_id: string;
  current_epoch_stake: string | null;
  fee_numerator: number | null;
  fee_denominator: number | null;
};

const validator = (overrides: Partial<IndexerValidator> = {}): IndexerValidator => ({
  account_id: VALIDATOR_ID,
  current_epoch_stake: "31516203410952749364980772561846",
  fee_numerator: 1,
  fee_denominator: 100,
  ...overrides,
});

const page = (count: number, prefix: string): IndexerValidator[] =>
  Array.from({ length: count }, (_, index) => validator({ account_id: `${prefix}-${index}.near` }));

const viewResult = (value: unknown) => ({
  jsonrpc: "2.0",
  id: "id",
  result: {
    result: Array.from(Buffer.from(JSON.stringify(value))),
    logs: [],
    block_height: 1,
    block_hash: "DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru",
  },
});

const mockRpc = (views: Record<string, unknown> = {}): void => {
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as {
        method: string;
        params: { request_type?: string; method_name?: string };
      };

      if (body.method === "gas_price") {
        return HttpResponse.json({
          jsonrpc: "2.0",
          id: "id",
          result: { gas_price: RPC_GAS_PRICE },
        });
      }

      if (body.params?.request_type === "call_function") {
        const methodName = body.params.method_name as string;
        return HttpResponse.json(viewResult(views[methodName]));
      }

      return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
    }),
  );
};

const mockNodeWithoutGasPrice = (): void => {
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, () =>
      HttpResponse.json({
        jsonrpc: "2.0",
        id: "id",
        error: { message: "node unavailable" },
      }),
    ),
  );
};

const mockDepositsStatus = (status: number): { requests: () => number } => {
  let requests = 0;
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () => {
      requests += 1;
      return HttpResponse.json({ message: "refused" }, { status });
    }),
  );
  return { requests: () => requests };
};

const mockStats = (data: { gas_price: string | null } | null): void => {
  mockServer.use(http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, () => HttpResponse.json({ data })));
};

// The shape Ledger's node (nearcore 2.13.4) answers a timed-out `send_tx` with: no `info` saying
// whether the transaction was seen, which only exists from nearcore 2.14.
const timeoutError = () => ({
  name: "HANDLER_ERROR",
  cause: { name: "TIMEOUT_ERROR" },
  code: -32000,
  message: "Server error",
  data: "Timeout",
});

const unknownTransactionError = (hash: string) => ({
  name: "HANDLER_ERROR",
  cause: { name: "UNKNOWN_TRANSACTION", info: { requested_transaction_hash: hash } },
  code: -32000,
  message: "Server error",
  data: `Transaction ${hash} doesn't exist`,
});

const rpcReply = (body: Record<string, unknown>, status = 200) =>
  HttpResponse.json({ jsonrpc: "2.0", id: "id", ...body }, { status });

// Replies to every request with the given HTTP status and JSON-RPC error, counting attempts.
const mockAlwaysFailing = (status: number, error: unknown): { attempts: () => number } => {
  let attempts = 0;
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, () => {
      attempts += 1;
      return rpcReply({ error }, status);
    }),
  );
  return { attempts: () => attempts };
};

type MockedNode = {
  sendTxCalls: () => number;
  sendTxTimes: () => number[];
  lookups: () => Record<string, unknown>[];
};

// Answers `send_tx` and the `tx` lookup separately, recording the calls made to each. `sendTx`
// is given the 1-based number of the attempt, and may take as long as it likes to answer.
const mockNode = ({
  sendTx,
  lookup,
}: {
  sendTx: (attempt: number) => Response | Promise<Response>;
  lookup: () => Response;
}): MockedNode => {
  const sendTxTimes: number[] = [];
  const lookups: Record<string, unknown>[] = [];

  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as { method: string; params: Record<string, unknown> };

      if (body.method === "tx") {
        lookups.push(body.params);
        return lookup();
      }

      sendTxTimes.push(Date.now());
      return sendTx(sendTxTimes.length);
    }),
  );

  return {
    sendTxCalls: () => sendTxTimes.length,
    sendTxTimes: () => sendTxTimes,
    lookups: () => lookups,
  };
};

// Retries without any delay, so tests that run the retries out do not wait for the backoff.
const NO_DELAY = {
  retryBudgetMs: 30_000,
  attemptTimeoutMs: 15_000,
  retryDelayMs: 0,
  maxRetryDelayMs: 0,
};

// A request the node never answers: it stays open until released, which a test does when done so
// that no timer is left running behind it.
const holdOpen = (): { held: Promise<void>; release: () => void } => {
  const state: { resolve?: () => void } = {};
  const held = new Promise<void>(resolve => {
    state.resolve = resolve;
  });

  return { held, release: () => state.resolve?.() };
};

// The expected hash comes from near-api-js's own signer, independent of the code under test.
const signTransaction = async (): Promise<{ signedTx: string; hash: string }> => {
  const keyPair = nearAPI.KeyPair.fromRandom("ed25519");
  const transaction = nearAPI.createTransaction(
    "sender.near",
    keyPair.getPublicKey(),
    "recipient.near",
    42,
    [nearAPI.actions.transfer(1000000000000000000000000n)],
    nearAPI.baseDecode("6ykMPuAsmyPvVMSLKvfg7DBUZP9tYcgKNzVLrLxSnLpj"),
  );
  const { txHash, signedTransaction } = await new nearAPI.KeyPairSigner(keyPair).signTransaction(
    transaction,
  );

  return {
    signedTx: Buffer.from(signedTransaction.encode()).toString("base64"),
    hash: nearAPI.baseEncode(txHash),
  };
};

describe("node api (indexer-backed calls)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      name: "NEAR",
      unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
      infra: {
        API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
        API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    getValidators.reset();
    getActionCosts.reset();
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  describe("getGasPrice", () => {
    it("reads the gas price from the node without calling the indexer", async () => {
      let statsRequests = 0;
      mockRpc();
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, () => {
          statsRequests += 1;
          return HttpResponse.json({ data: { gas_price: "100000000" } });
        }),
      );

      const gasPrice = await getGasPrice(mockNearConfig);

      expect(gasPrice).toBe(RPC_GAS_PRICE);
      expect(statsRequests).toBe(0);
    });

    it("reads the v3 stats envelope when the node cannot answer", async () => {
      let requestedPath: string | undefined;
      mockNodeWithoutGasPrice();
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json({ data: { gas_price: "100000000" } });
        }),
      );

      const gasPrice = await getGasPrice(mockNearConfig);

      expect(requestedPath).toBe("/v3/stats");
      expect(gasPrice).toBe("100000000");
    });

    it.each([
      ["a null gas price", { gas_price: null }],
      ["an empty gas price", { gas_price: "" }],
      ["a null envelope data", null],
    ])("rejects when the node fails and the indexer reports %s", async (_label, data) => {
      mockNodeWithoutGasPrice();
      mockStats(data);

      await expect(getGasPrice(mockNearConfig)).rejects.toThrow(
        "Near: no gas price from the node or the indexer",
      );
    });

    it("rejects after one indexer request when the node fails and the indexer answers 429", async () => {
      mockNodeWithoutGasPrice();
      let statsRequests = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, () => {
          statsRequests += 1;
          return HttpResponse.json({ message: "Too Many Requests" }, { status: 429 });
        }),
      );

      await expect(getGasPrice(mockNearConfig)).rejects.toThrow("Too Many Requests");
      expect(statsRequests).toBe(1);
    });
  });

  describe("getAccount", () => {
    const mockAccount = (storageAmountPerByte: string): void => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([]),
        ),
        http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
          const body = (await request.json()) as {
            method: string;
            params: { request_type?: string };
          };

          if (body.method === "EXPERIMENTAL_protocol_config") {
            return HttpResponse.json({
              result: { runtime_config: runtimeConfig(storageAmountPerByte) },
            });
          }

          if (body.params?.request_type === "view_account") {
            return HttpResponse.json({
              result: { amount: "1000000000000000000000000", storage_usage: 182, block_height: 1 },
            });
          }

          return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
        }),
      );
    };

    it("derives storageUsageBalance from the protocol config, not the preload cache", async () => {
      // Distinct from FALLBACK_STORAGE_AMOUNT_PER_BYTE (constants.ts) — proves the value comes
      // from the live protocol config rather than the preload cache's zeroed/fallback default.
      mockAccount("20000000000000000000");

      const account = await getAccount(mockNearConfig, ADDRESS);

      // storageUsageBalance = storageCost * storage_usage (182) + MIN_ACCOUNT_BALANCE_BUFFER
      expect(account.nearResources.storageUsageBalance.toFixed()).toBe("53640000000000000000000");
    });
  });

  describe("getStakingPositions", () => {
    it("rejects after a single request when the listing answers 429, never an empty list", async () => {
      const deposits = mockDepositsStatus(429);
      mockRpc();

      await expect(getStakingPositions(mockNearConfig, ADDRESS)).rejects.toMatchObject({
        status: 429,
      });
      expect(deposits.requests()).toBe(1);
    });

    it("rejects getAccount after a single request when the listing answers 429", async () => {
      const deposits = mockDepositsStatus(429);
      mockRpc();

      await expect(getAccount(mockNearConfig, ADDRESS)).rejects.toMatchObject({ status: 429 });
      expect(deposits.requests()).toBe(1);
    });

    it("still retries the listing on a 503", async () => {
      const deposits = mockDepositsStatus(503);
      mockRpc();

      await expect(getStakingPositions(mockNearConfig, ADDRESS)).rejects.toMatchObject({
        status: 503,
      });
      expect(deposits.requests()).toBe(getNetworkState().getCallsRetry + 1);
    });

    it("discovers delegated validators through the v3 kitwallet endpoint", async () => {
      let requestedPath: string | undefined;
      mockServer.use(
        http.get(
          `${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`,
          ({ request }) => {
            requestedPath = new URL(request.url).pathname;
            return HttpResponse.json([
              { deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID },
            ]);
          },
        ),
      );
      mockRpc({
        get_account_staked_balance: "1000000000000000000000000",
        get_account_unstaked_balance: "0",
        is_account_unstaked_balance_available: false,
      });

      const { stakingPositions, totalStaked } = await getStakingPositions(mockNearConfig, ADDRESS);

      expect(requestedPath).toBe(`/v3/kitwallet/staking-deposits/${ADDRESS}`);
      expect(totalStaked.toFixed()).toBe("1000000000000000000000000");
      expect(stakingPositions).toHaveLength(1);
      expect(stakingPositions[0].validatorId).toBe(VALIDATOR_ID);
    });

    it("handles an account with no deposits", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([]),
        ),
      );
      mockRpc();

      const { stakingPositions, totalStaked } = await getStakingPositions(mockNearConfig, ADDRESS);

      expect(stakingPositions).toEqual([]);
      expect(totalStaked.toFixed()).toBe("0");
    });

    it("reports an unstaked balance as available once the node says it is withdrawable", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([{ deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID }]),
        ),
      );
      mockRpc({
        get_account_staked_balance: "0",
        get_account_unstaked_balance: "2000000000000000000000000",
        is_account_unstaked_balance_available: true,
      });

      const { stakingPositions, totalAvailable, totalPending } = await getStakingPositions(
        mockNearConfig,
        ADDRESS,
      );

      expect(totalAvailable.toFixed()).toBe("2000000000000000000000000");
      expect(totalPending.toFixed()).toBe("0");
      expect(stakingPositions[0].available.toFixed()).toBe("2000000000000000000000000");
    });

    it("reports an unstaked balance as pending while it is still locked", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([{ deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID }]),
        ),
      );
      mockRpc({
        get_account_staked_balance: "0",
        get_account_unstaked_balance: "3000000000000000000000000",
        is_account_unstaked_balance_available: false,
      });

      const { totalAvailable, totalPending } = await getStakingPositions(mockNearConfig, ADDRESS);

      expect(totalAvailable.toFixed()).toBe("0");
      expect(totalPending.toFixed()).toBe("3000000000000000000000000");
    });
  });

  describe("getStakingPositions with stored pools", () => {
    const OTHER_POOL = "other.poolv1.near";
    const STAKED = "1000000000000000000000000";

    const mockListing = (respond: () => Response): { calls: () => number } => {
      let calls = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () => {
          calls += 1;
          return respond();
        }),
      );
      return { calls: () => calls };
    };

    // Answers the three views of every pool, except those of `broken` pools, which the node refuses.
    const mockPools = (
      broken: string[] = [],
      notPools: string[] = [],
    ): { pools: () => Set<string> } => {
      const pools = new Set<string>();
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
          const body = (await request.json()) as {
            params: { request_type?: string; method_name?: string; account_id?: string };
          };
          if (body.params?.request_type !== "call_function") {
            return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
          }
          pools.add(body.params.account_id as string);
          if (broken.includes(body.params.account_id as string)) {
            return HttpResponse.json({ jsonrpc: "2.0", id: "id", error: { code: -32000 } });
          }
          if (notPools.includes(body.params.account_id as string)) {
            return HttpResponse.json({
              jsonrpc: "2.0",
              id: "id",
              result: {
                error:
                  "wasm execution failed with error: FunctionCallError(MethodResolveError(MethodNotFound))",
                logs: [],
                block_height: 1,
                block_hash: "DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru",
              },
            });
          }
          const views: Record<string, unknown> = {
            get_account_staked_balance: STAKED,
            get_account_unstaked_balance: "0",
            is_account_unstaked_balance_available: false,
          };
          return HttpResponse.json(viewResult(views[body.params.method_name as string]));
        }),
      );
      return { pools: () => pools };
    };

    it("reads the union of the listed and the known pools", async () => {
      mockListing(() => HttpResponse.json([{ deposit: STAKED, validator_id: VALIDATOR_ID }]));
      mockPools();

      const { stakingPositions } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL, VALIDATOR_ID],
      });

      expect(stakingPositions.map(p => p.validatorId).sort()).toEqual([VALIDATOR_ID, OTHER_POOL]);
    });

    it("makes no listing request when listValidators is false", async () => {
      const listing = mockListing(() => HttpResponse.json([]));
      const node = mockPools();

      const { stakingPositions } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
        listValidators: false,
      });

      expect(listing.calls()).toBe(0);
      expect(node.pools().has(OTHER_POOL)).toBe(true);
      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL]);
    });

    it("reads the known pools when the listing is refused", async () => {
      const listing = mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();

      const { stakingPositions, totalStaked } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
      });

      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL]);
      expect(totalStaked.toFixed()).toBe(STAKED);
      // A nearblocks 429 is not retried: one listing attempt.
      expect(listing.calls()).toBe(1);
    });

    it("rejects when the listing fails and no pool is known", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();

      await expect(getStakingPositions(mockNearConfig, ADDRESS, {})).rejects.toBeInstanceOf(Error);
    });

    it("rejects when the listing fails and no options are given", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();

      await expect(getStakingPositions(mockNearConfig, ADDRESS)).rejects.toBeInstanceOf(Error);
    });

    it("rejects when a known pool cannot be read on the node, instead of dropping it", async () => {
      mockListing(() => HttpResponse.json([]));
      mockPools([OTHER_POOL]);

      await expect(
        getStakingPositions(mockNearConfig, ADDRESS, {
          knownValidatorIds: [OTHER_POOL, VALIDATOR_ID],
        }),
      ).rejects.toBeInstanceOf(Error);
    });

    it("rejects when a known pool cannot be read and the listing is skipped", async () => {
      mockPools([OTHER_POOL]);

      await expect(
        getStakingPositions(mockNearConfig, ADDRESS, {
          knownValidatorIds: [OTHER_POOL, VALIDATOR_ID],
          listValidators: false,
        }),
      ).rejects.toBeInstanceOf(Error);
    });

    it("still rejects on a failing pool when no known pools are given", async () => {
      mockListing(() => HttpResponse.json([{ deposit: STAKED, validator_id: OTHER_POOL }]));
      mockPools([OTHER_POOL]);

      await expect(getStakingPositions(mockNearConfig, ADDRESS)).rejects.toBeInstanceOf(Error);
    });

    it("reports a failed listing, and no failure when the listing succeeds or is skipped", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();
      const failed = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
      });
      expect(failed.poolListingFailed).toBe(true);

      mockListing(() => HttpResponse.json([]));
      const listed = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
      });
      expect(listed.poolListingFailed).toBe(false);

      const skipped = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
        listValidators: false,
      });
      expect(skipped.poolListingFailed).toBe(false);
    });

    it("reads the candidate pools when the listing fails, counting their stake", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();

      const { stakingPositions, totalStaked } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
        candidateValidatorIds: [VALIDATOR_ID],
      });

      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL, VALIDATOR_ID]);
      expect(totalStaked.toFixed()).toBe(new BigNumber(STAKED).times(2).toFixed());
    });

    it("reports a candidate pool whose node read fails, without failing the call", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools([VALIDATOR_ID]);

      const { stakingPositions, failedCandidates } = await getStakingPositions(
        mockNearConfig,
        ADDRESS,
        { knownValidatorIds: [OTHER_POOL], candidateValidatorIds: [VALIDATOR_ID] },
      );

      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL]);
      expect(failedCandidates).toEqual([VALIDATOR_ID]);
    });

    it("drops a candidate the node shows is not a staking pool, without reporting it", async () => {
      mockListing(() => HttpResponse.json([]));
      mockPools([], [VALIDATOR_ID]);

      const { stakingPositions, failedCandidates } = await getStakingPositions(
        mockNearConfig,
        ADDRESS,
        { knownValidatorIds: [OTHER_POOL], candidateValidatorIds: [VALIDATOR_ID] },
      );

      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL]);
      expect(failedCandidates).toEqual([]);
    });

    it("still rejects a failed listing when only candidate pools are given", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools();

      await expect(
        getStakingPositions(mockNearConfig, ADDRESS, { candidateValidatorIds: [VALIDATOR_ID] }),
      ).rejects.toBeInstanceOf(Error);
    });

    it("reads a candidate pool the listing omits, even when the listing succeeds", async () => {
      mockListing(() => HttpResponse.json([]));
      mockPools();

      const { stakingPositions, totalStaked } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
        candidateValidatorIds: [VALIDATOR_ID],
      });

      expect(stakingPositions.map(p => p.validatorId)).toEqual([OTHER_POOL, VALIDATOR_ID]);
      expect(totalStaked.toFixed()).toBe(new BigNumber(STAKED).times(2).toFixed());
    });

    it("reads a candidate pool the listing returns once, as a required pool", async () => {
      mockListing(() => HttpResponse.json([{ deposit: STAKED, validator_id: VALIDATOR_ID }]));
      mockPools();

      const { stakingPositions } = await getStakingPositions(mockNearConfig, ADDRESS, {
        knownValidatorIds: [OTHER_POOL],
        candidateValidatorIds: [VALIDATOR_ID],
      });

      expect(stakingPositions.map(p => p.validatorId)).toEqual([VALIDATOR_ID, OTHER_POOL]);
    });

    it("reads a candidate that is also known only once, as a required pool", async () => {
      mockListing(() => new HttpResponse(null, { status: 429 }));
      mockPools([OTHER_POOL]);

      await expect(
        getStakingPositions(mockNearConfig, ADDRESS, {
          knownValidatorIds: [OTHER_POOL],
          candidateValidatorIds: [OTHER_POOL],
        }),
      ).rejects.toBeInstanceOf(Error);
    });
  });

  describe("getAccount with a pre-read account", () => {
    it("reuses the given account details instead of reading the account again", async () => {
      let viewAccountCalls = 0;
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
          const body = (await request.json()) as {
            method: string;
            params: { request_type?: string };
          };
          if (body.method === "EXPERIMENTAL_protocol_config") {
            return HttpResponse.json({ result: { runtime_config: runtimeConfig("1") } });
          }
          if (body.params?.request_type === "view_account") viewAccountCalls += 1;
          return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
        }),
      );

      const account = await getAccount(mockNearConfig, ADDRESS, {
        accountDetails: { amount: "5", storage_usage: 1, block_height: 9 },
        knownValidatorIds: [],
        listValidators: false,
      });

      expect(viewAccountCalls).toBe(0);
      expect(account.blockHeight).toBe(9);
      expect(account.balance.toFixed()).toBe("5");
    });
  });

  describe("getAccountStateFingerprint", () => {
    const IMPLICIT = "00".repeat(31) + "01";
    const details = {
      amount: "10",
      locked: "2",
      storage_usage: 182,
      code_hash: "11111111111111111111111111111111",
      block_height: 1,
    };

    const mockKey = (
      respond: () => Response,
    ): { requests: () => { account_id: string; public_key: string }[] } => {
      const requests: { account_id: string; public_key: string }[] = [];
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
          const body = (await request.json()) as {
            params: { request_type?: string; account_id: string; public_key: string };
          };
          if (body.params?.request_type === "view_access_key") {
            requests.push({
              account_id: body.params.account_id,
              public_key: body.params.public_key,
            });
            return respond();
          }
          return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
        }),
      );
      return { requests: () => requests };
    };

    it("includes the nonce of the implicit account's own key", async () => {
      const key = mockKey(() => HttpResponse.json({ result: { nonce: 42, block_hash: "hash" } }));

      const fingerprint = await getAccountStateFingerprint(mockNearConfig, IMPLICIT, details);

      expect(fingerprint).toBe(`10|2|182|${details.code_hash}|42`);
      expect(key.requests()).toEqual([
        {
          account_id: IMPLICIT,
          public_key: `ed25519:${nearAPI.baseEncode(Buffer.from(IMPLICIT, "hex"))}`,
        },
      ]);
    });

    it("does not read a key for a named account", async () => {
      const key = mockKey(() => HttpResponse.json({ result: { nonce: 1 } }));

      const fingerprint = await getAccountStateFingerprint(mockNearConfig, ADDRESS, details);

      expect(fingerprint).toBe(`10|2|182|${details.code_hash}|`);
      expect(key.requests()).toEqual([]);
    });

    it("leaves the nonce empty when the key read fails", async () => {
      mockKey(() => HttpResponse.json({ error: { message: "unknown key" } }, { status: 400 }));

      await expect(getAccountStateFingerprint(mockNearConfig, IMPLICIT, details)).resolves.toBe(
        `10|2|182|${details.code_hash}|`,
      );
    });

    it("leaves the nonce empty when the key is unknown", async () => {
      mockKey(() => HttpResponse.json({ result: {} }));

      await expect(getAccountStateFingerprint(mockNearConfig, IMPLICIT, details)).resolves.toBe(
        `10|2|182|${details.code_hash}|`,
      );
    });

    it("changes with the amount, and tolerates a missing account", async () => {
      const a = await getAccountStateFingerprint(mockNearConfig, ADDRESS, details);
      const b = await getAccountStateFingerprint(mockNearConfig, ADDRESS, {
        ...details,
        amount: "11",
      });

      expect(a).not.toBe(b);
      await expect(getAccountStateFingerprint(mockNearConfig, ADDRESS, undefined)).resolves.toBe(
        "||||",
      );
    });
  });

  describe("broadcastTransaction", () => {
    const mockSendTx = (result: unknown, error?: unknown): void => {
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, () =>
          HttpResponse.json({ jsonrpc: "2.0", id: "id", result, error }),
        ),
      );
    };

    it("returns the transaction hash on success", async () => {
      mockSendTx({ transaction: { hash: "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w" } });

      await expect(broadcastTransaction(mockNearConfig, "signed-tx")).resolves.toBe(
        "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w",
      );
    });

    it("throws when the node responds with no transaction hash", async () => {
      mockSendTx({ transaction: {} });

      await expect(broadcastTransaction(mockNearConfig, "signed-tx")).rejects.toThrow(
        "Near: send_tx returned no transaction hash",
      );
    });

    it("propagates a non-timeout node error immediately", async () => {
      mockSendTx(undefined, { cause: { name: "INVALID_TRANSACTION" }, message: "nonce too small" });

      await expect(broadcastTransaction(mockNearConfig, "signed-tx")).rejects.toThrow(
        "INVALID_TRANSACTION: nonce too small",
      );
    });

    it("retries once on a timeout then returns the hash", async () => {
      let attempts = 0;
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, () => {
          attempts += 1;
          if (attempts === 1) {
            return HttpResponse.json({
              jsonrpc: "2.0",
              id: "id",
              error: { cause: { name: "TIMEOUT_ERROR" }, message: "timed out" },
            });
          }
          return HttpResponse.json({
            jsonrpc: "2.0",
            id: "id",
            result: { transaction: { hash: "retried-hash" } },
          });
        }),
      );

      await expect(
        broadcastTransaction(mockNearConfig, "signed-tx", undefined, NO_DELAY),
      ).resolves.toBe("retried-hash");
      expect(attempts).toBe(2);
    });

    describe("HTTP error statuses", () => {
      it("retries an HTTP 408 timeout then returns the hash", async () => {
        let attempts = 0;
        mockServer.use(
          http.post(NEAR_BASE_URL_MOCKED, () => {
            attempts += 1;
            if (attempts === 1) {
              return HttpResponse.json(
                { jsonrpc: "2.0", id: "id", error: timeoutError() },
                { status: 408 },
              );
            }
            return HttpResponse.json({
              jsonrpc: "2.0",
              id: "id",
              result: { transaction: { hash: "retried-hash" } },
            });
          }),
        );

        await expect(
          broadcastTransaction(mockNearConfig, "signed-tx", undefined, NO_DELAY),
        ).resolves.toBe("retried-hash");
        expect(attempts).toBe(2);
      });

      describe("timeout without details once retries run out", () => {
        it("looks the transaction up by hash and returns it when the node has it", async () => {
          const { signedTx, hash } = await signTransaction();
          const node = mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ result: { transaction: { hash } } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).resolves.toBe(hash);
          expect(node.sendTxCalls()).toBe(7);
          expect(node.lookups()).toEqual([
            { tx_hash: hash, sender_account_id: "sender.near", wait_until: "NONE" },
          ]);
        });

        it("prefers the hash the node reports over the derived one", async () => {
          const { signedTx } = await signTransaction();
          mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ result: { transaction: { hash: "node-hash" } } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).resolves.toBe("node-hash");
        });

        it("accepts a transaction the node has not produced an outcome for yet", async () => {
          const { signedTx, hash } = await signTransaction();
          mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ result: { final_execution_status: "INCLUDED" } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).resolves.toBe(hash);
        });

        it("reports the timeout when the node does not know the transaction", async () => {
          const { signedTx, hash } = await signTransaction();
          const node = mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ error: unknownTransactionError(hash) }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).rejects.toThrow("TIMEOUT_ERROR: Timeout");
          expect(node.lookups()).toHaveLength(1);
        });

        it("reports the timeout, not the lookup failure, when the lookup itself fails", async () => {
          const { signedTx } = await signTransaction();
          mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => new HttpResponse("Bad Gateway", { status: 502 }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).rejects.toThrow("TIMEOUT_ERROR: Timeout");
        });

        it("does not look anything up when the payload cannot be decoded", async () => {
          const node = mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ result: { transaction: { hash: "unexpected" } } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, "signed-tx", undefined, NO_DELAY),
          ).rejects.toThrow("TIMEOUT_ERROR: Timeout");
          expect(node.lookups()).toHaveLength(0);
        });
      });

      it("stops retrying once the time budget is spent, then falls back to the lookup", async () => {
        // Each timed-out attempt is held open ~10s by the node; fake the clock to follow suit.
        let clock = 1_700_000_000_000;
        const dateNow = jest.spyOn(Date, "now").mockImplementation(() => clock);
        const { signedTx, hash } = await signTransaction();

        try {
          const node = mockNode({
            sendTx: () => {
              clock += 10_000;
              return rpcReply({ error: timeoutError() }, 408);
            },
            lookup: () => rpcReply({ result: { transaction: { hash } } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, NO_DELAY),
          ).resolves.toBe(hash);
          expect(node.sendTxCalls()).toBe(3);
          expect(node.lookups()).toHaveLength(1);
        } finally {
          dateNow.mockRestore();
        }
      });

      describe("spacing out the retries", () => {
        it("waits longer before each retry, up to the cap", async () => {
          const { signedTx } = await signTransaction();
          const node = mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ error: unknownTransactionError("unknown") }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, {
              ...NO_DELAY,
              retryDelayMs: 20,
              maxRetryDelayMs: 80,
            }),
          ).rejects.toThrow("TIMEOUT_ERROR: Timeout");

          const times = node.sendTxTimes();
          const gaps = times.slice(1).map((time, index) => time - (times[index] ?? 0));

          expect(gaps).toHaveLength(6);
          // Lower bounds only: a timer may fire a little late, never meaningfully early.
          [20, 40, 80, 80, 80, 80].forEach((expected, index) => {
            expect(gaps[index]).toBeGreaterThanOrEqual(expected - 5);
          });
        });

        it("does not start a retry it has no budget left to wait for", async () => {
          const { signedTx, hash } = await signTransaction();
          const node = mockNode({
            sendTx: () => rpcReply({ error: timeoutError() }, 408),
            lookup: () => rpcReply({ result: { transaction: { hash } } }),
          });

          await expect(
            broadcastTransaction(mockNearConfig, signedTx, undefined, {
              ...NO_DELAY,
              retryBudgetMs: 100,
              retryDelayMs: 500,
              maxRetryDelayMs: 500,
            }),
          ).resolves.toBe(hash);
          expect(node.sendTxCalls()).toBe(1);
          expect(node.lookups()).toHaveLength(1);
        });
      });

      describe("attempts the node never answers", () => {
        it("gives up on the attempt and retries it", async () => {
          const hold = holdOpen();
          const node = mockNode({
            sendTx: async attempt => {
              if (attempt === 1) await hold.held;
              return rpcReply({ result: { transaction: { hash: "retried-hash" } } });
            },
            lookup: () => rpcReply({ error: unknownTransactionError("unused") }),
          });

          try {
            await expect(
              broadcastTransaction(mockNearConfig, "signed-tx", undefined, {
                ...NO_DELAY,
                attemptTimeoutMs: 50,
              }),
            ).resolves.toBe("retried-hash");
            expect(node.sendTxCalls()).toBe(2);
          } finally {
            hold.release();
          }
        });

        it("falls back to the lookup when no attempt is ever answered", async () => {
          const { signedTx, hash } = await signTransaction();
          const hold = holdOpen();
          const node = mockNode({
            sendTx: async () => {
              await hold.held;
              return rpcReply({ error: timeoutError() }, 408);
            },
            lookup: () => rpcReply({ result: { transaction: { hash } } }),
          });

          try {
            await expect(
              broadcastTransaction(mockNearConfig, signedTx, 2, {
                ...NO_DELAY,
                attemptTimeoutMs: 50,
              }),
            ).resolves.toBe(hash);
            expect(node.sendTxCalls()).toBe(3);
            expect(node.lookups()).toHaveLength(1);
          } finally {
            hold.release();
          }
        });

        it("never lets an attempt outlast what is left of the budget", async () => {
          const { signedTx, hash } = await signTransaction();
          const hold = holdOpen();
          const node = mockNode({
            // Without the cap this attempt is given the full 10 s and Jest's own limit hits first.
            sendTx: async () => {
              await hold.held;
              return rpcReply({ error: timeoutError() }, 408);
            },
            lookup: () => rpcReply({ result: { transaction: { hash } } }),
          });

          try {
            await expect(
              broadcastTransaction(mockNearConfig, signedTx, undefined, {
                ...NO_DELAY,
                retryBudgetMs: 100,
                attemptTimeoutMs: 10_000,
              }),
            ).resolves.toBe(hash);
            expect(node.lookups()).toHaveLength(1);
          } finally {
            hold.release();
          }
        });
      });

      it("reports the nested error text of an HTTP 400 instead of [object Object]", async () => {
        mockAlwaysFailing(400, {
          name: "REQUEST_VALIDATION_ERROR",
          cause: {
            name: "PARSE_ERROR",
            info: { error_message: "Failed parsing args: invalid transaction version tag: 105" },
          },
          code: -32700,
          message: "Parse error",
          data: "Failed parsing args: invalid transaction version tag: 105",
        });

        const error = await broadcastTransaction(mockNearConfig, "signed-tx").catch(
          (e: Error) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "PARSE_ERROR: Failed parsing args: invalid transaction version tag: 105",
        );
      });

      it("falls back to the message when the error data is an object", async () => {
        mockAlwaysFailing(200, {
          name: "HANDLER_ERROR",
          cause: { name: "INVALID_TRANSACTION", info: {} },
          code: -32000,
          message: "Server error",
          data: { TxExecutionError: { InvalidTxError: "Expired" } },
        });

        const error = await broadcastTransaction(mockNearConfig, "signed-tx").catch(
          (e: Error) => e,
        );

        expect((error as Error).message).toBe("INVALID_TRANSACTION: Server error");
      });

      it("names the HTTP status when a failing response is not a JSON-RPC body", async () => {
        mockServer.use(
          http.post(
            NEAR_BASE_URL_MOCKED,
            () => new HttpResponse("Internal Server Error", { status: 500 }),
          ),
        );

        await expect(broadcastTransaction(mockNearConfig, "signed-tx")).rejects.toThrow(
          "Near: send_tx failed with HTTP 500",
        );
      });
    });
  });

  describe("getValidators", () => {
    it("rejects after a single request when the indexer answers 429", async () => {
      let requests = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({ message: "Too Many Requests" }, { status: 429 });
        }),
      );

      await expect(getValidators({ total: 20, config: mockNearConfig })).rejects.toMatchObject({
        status: 429,
      });
      expect(requests).toBe(1);
    });

    it("maps the flat snake_case v3 shape", async () => {
      let requestedUrl: URL | undefined;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          requestedUrl = new URL(request.url);
          return HttpResponse.json({ data: [validator()] });
        }),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(requestedUrl?.pathname).toBe("/v3/validators");
      expect(requestedUrl?.searchParams.get("limit")).toBe("100");
      expect(validators).toEqual([
        {
          account_id: VALIDATOR_ID,
          stake: "31516203410952749364980772561846",
          commission: 1,
        },
      ]);
    });

    it("computes the same commission percentage as the previous fee shape", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({
            data: [validator({ fee_numerator: 7, fee_denominator: 100 })],
          }),
        ),
      );

      const [mapped] = await getValidators({ total: 200, config: mockNearConfig });

      expect(mapped.commission).toBe(7);
    });

    it("walks the cursor until the requested total is collected", async () => {
      const cursor = "eyJhY2NvdW50X2lkIjoid2Fja2F6b25nLnBvb2x2MS5uZWFyIn0=";
      const receivedCursors: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");
          receivedCursors.push(next);

          if (!next) {
            return HttpResponse.json({
              data: page(100, "first"),
              meta: { next_page: cursor },
            });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(validators).toHaveLength(200);
      expect(receivedCursors).toEqual([null, cursor]);
      expect(validators[0].account_id).toBe("first-0.near");
      expect(validators[100].account_id).toBe("second-0.near");
    });

    it("url-encodes the cursor so an opaque base64 token survives the round trip", async () => {
      const cursor = "YWJjZGVm+Z2hpamts/bW5vcA==";
      const receivedCursors: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");
          receivedCursors.push(next);

          if (!next) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: cursor } });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      await getValidators({ total: 200, config: mockNearConfig });

      expect(receivedCursors[1]).toBe(cursor);
    });

    it("stops when the indexer returns no further cursor", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: page(100, "only") }),
        ),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(validators).toHaveLength(100);
    });

    it("never returns more than the requested total", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");

          if (!next) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: "cursor" } });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      const validators = await getValidators({ total: 150, config: mockNearConfig });

      expect(validators).toHaveLength(150);
    });

    it("returns no validators when the envelope data is null", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => HttpResponse.json({ data: null })),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(validators).toEqual([]);
    });

    it("defaults the stake when the current epoch stake is null", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: [validator({ current_epoch_stake: null })] }),
        ),
      );

      const [mapped] = await getValidators({ total: 200, config: mockNearConfig });

      expect(mapped.stake).toBe("0");
    });

    it.each([
      ["a null denominator", { fee_denominator: null }],
      ["a null numerator", { fee_numerator: null }],
      ["a zero denominator", { fee_denominator: 0 }],
    ])("returns a zero commission for %s", async (_label, overrides) => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: [validator(overrides)] }),
        ),
      );

      const [mapped] = await getValidators({ total: 200, config: mockNearConfig });

      expect(mapped.commission).toBe(0);
    });

    it("stops on an empty page even if the indexer keeps advertising a cursor", async () => {
      let requests = 0;

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({ data: [], meta: { next_page: "same-cursor-every-time" } });
        }),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(requests).toBe(1);
      expect(validators).toEqual([]);
    });

    it("never issues more requests than the pages needed for the total", async () => {
      let requests = 0;

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({
            data: [validator({ account_id: `v${requests}.near` })],
            meta: { next_page: "same-cursor-every-time" },
          });
        }),
      );

      const validators = await getValidators({ total: 200, config: mockNearConfig });

      expect(requests).toBe(2);
      expect(validators).toHaveLength(2);
    });

    it("requests only the outstanding validators on each page", async () => {
      const requestedLimits: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const url = new URL(request.url);
          requestedLimits.push(url.searchParams.get("limit"));

          if (!url.searchParams.get("next")) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: "cursor" } });
          }

          return HttpResponse.json({ data: page(50, "second") });
        }),
      );

      const validators = await getValidators({ total: 150, config: mockNearConfig });

      expect(requestedLimits).toEqual(["100", "50"]);
      expect(validators).toHaveLength(150);
    });

    it("caches per requested total rather than serving one total's result to another", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const limit = Number(new URL(request.url).searchParams.get("limit"));
          return HttpResponse.json({ data: page(limit, "any") });
        }),
      );

      const five = await getValidators({ total: 5, config: mockNearConfig });
      const ten = await getValidators({ total: 10, config: mockNearConfig });

      expect(five).toHaveLength(5);
      expect(ten).toHaveLength(10);
    });

    it("issues a single request when the total fits in one page", async () => {
      const requestedLimits: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          requestedLimits.push(new URL(request.url).searchParams.get("limit"));
          return HttpResponse.json({ data: page(20, "only"), meta: { next_page: "cursor" } });
        }),
      );

      const validators = await getValidators({ total: 20, config: mockNearConfig });

      expect(requestedLimits).toEqual(["20"]);
      expect(validators).toHaveLength(20);
    });

    it("fetches again after a failure, which is not cached", async () => {
      let requests = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          if (requests === 1) {
            return HttpResponse.json({ message: "Bad Request" }, { status: 400 });
          }
          return HttpResponse.json({ data: [validator()] });
        }),
      );

      await expect(getValidators({ total: 20, config: mockNearConfig })).rejects.toThrow(
        "Bad Request",
      );
      const validators = await getValidators({ total: 20, config: mockNearConfig });

      expect(requests).toBe(2);
      expect(validators).toHaveLength(1);
    });

    it("serves two calls inside the TTL from a single fetch", async () => {
      let requests = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({ data: [validator()] });
        }),
      );

      await getValidators({ total: 20, config: mockNearConfig });
      await getValidators({ total: 20, config: mockNearConfig });

      expect(requests).toBe(1);
    });
  });
});
