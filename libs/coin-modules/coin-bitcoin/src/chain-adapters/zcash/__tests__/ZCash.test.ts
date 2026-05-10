/* eslint @typescript-eslint/consistent-type-assertions: 0 */
import { Observable } from "rxjs";
import type { ShieldedSyncResult, ShieldedSyncResultRaw, SyncShieldedArgs } from "../types";
import type { StartSyncJobArgs } from "../native-engine/engine";
import { createZCashClientWith, type ZCashClientDeps } from "../ZCash";

// ── Constants ────────────────────────────────────────────────────────

const GRPC_URL = "https://grpc.example.com";
const DEFAULT_START_BLOCK_HEIGHT = 100;
const DEFAULT_VIEWING_KEY = "zxviewtesttesttesttesttest";
const DEFAULT_MAX_BATCH_SIZE = 500;
const DEFAULT_PROCESSED_BLOCKS = 500;

// ── Helpers ───────────────────────────────────────────────────────────

type SyncJobHooks = {
  isCancelled: () => boolean;
  onActiveStream?: (stream: { cancel: () => void } | null) => void;
};

function makeSyncArgs(overrides?: Partial<SyncShieldedArgs>): SyncShieldedArgs {
  return {
    startBlockHeight: DEFAULT_START_BLOCK_HEIGHT,
    viewingKey: DEFAULT_VIEWING_KEY,
    maxBatchSize: DEFAULT_MAX_BATCH_SIZE,
    ...overrides,
  };
}

function makeRawChunk(overrides?: Partial<ShieldedSyncResultRaw>): ShieldedSyncResultRaw {
  return {
    processedBlocks: DEFAULT_PROCESSED_BLOCKS,
    remainingBlocks: 0,
    transactions: [],
    ...overrides,
  };
}

function makeRehydrated(overrides?: Partial<ShieldedSyncResult>): ShieldedSyncResult {
  return {
    processedBlocks: DEFAULT_PROCESSED_BLOCKS,
    remainingBlocks: 0,
    transactions: [],
    ...overrides,
  };
}

function makeDeps(overrides?: Partial<ZCashClientDeps>): ZCashClientDeps {
  return {
    getChainTipJob: jest.fn<Promise<number>, [string]>(),
    findBlockHeightJob: jest.fn<Promise<number>, [string, number]>(),
    validateStartSyncArgs: jest.fn<string | null, [SyncShieldedArgs]>().mockReturnValue(null),
    startSyncJob: jest.fn().mockResolvedValue(undefined),
    rehydrateSyncResult: jest.fn<ShieldedSyncResult, [ShieldedSyncResultRaw]>(),
    createSyncTimeEstimator: jest.fn(() => (_processedBlocks: number) => ({
      hours: 0,
      minutes: 0,
    })),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("createZCashClientWith", () => {
  // ── Constructor ───────────────────────────────────────────────────

  describe("constructor", () => {
    it("stores grpcUrl and defaults network to 'mainnet'", () => {
      const client = createZCashClientWith(makeDeps(), { grpcUrl: GRPC_URL });
      expect(client.grpcUrl).toBe(GRPC_URL);
      expect(client.network).toBe("mainnet");
    });

    it("uses the provided network when specified", () => {
      const client = createZCashClientWith(makeDeps(), { grpcUrl: GRPC_URL, network: "testnet" });
      expect(client.network).toBe("testnet");
    });
  });

  // ── getChainTip ───────────────────────────────────────────────────

  describe("getChainTip()", () => {
    it("delegates to getChainTipJob with grpcUrl", async () => {
      const deps = makeDeps({
        getChainTipJob: jest.fn<Promise<number>, [string]>().mockResolvedValue(2_000_000),
      });
      const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });

      const tip = await client.getChainTip();

      expect(deps.getChainTipJob).toHaveBeenCalledWith(GRPC_URL);
      expect(tip).toBe(2_000_000);
    });

    it("propagates errors", async () => {
      const deps = makeDeps({
        getChainTipJob: jest.fn().mockRejectedValue(new Error("gRPC unavailable")),
      });
      const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
      await expect(client.getChainTip()).rejects.toThrow("gRPC unavailable");
    });
  });

  // ── findBlockHeight ───────────────────────────────────────────────

  describe("findBlockHeight()", () => {
    it("delegates to findBlockHeightJob with grpcUrl and timestamp", async () => {
      const deps = makeDeps({
        findBlockHeightJob: jest
          .fn<Promise<number>, [string, number]>()
          .mockResolvedValue(1_500_000),
      });
      const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });

      const height = await client.findBlockHeight(1_700_000_000);

      expect(deps.findBlockHeightJob).toHaveBeenCalledWith(GRPC_URL, 1_700_000_000);
      expect(height).toBe(1_500_000);
    });

    it("propagates errors", async () => {
      const deps = makeDeps({
        findBlockHeightJob: jest.fn().mockRejectedValue(new Error("timestamp out of range")),
      });
      const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
      await expect(client.findBlockHeight(0)).rejects.toThrow("timestamp out of range");
    });
  });

  // ── estimatedSyncTime ─────────────────────────────────────────────

  describe("estimatedSyncTime()", () => {
    it("returns a function that estimates remaining time", async () => {
      const client = createZCashClientWith(makeDeps(), { grpcUrl: GRPC_URL });
      const estimator = await client.estimatedSyncTime(1000);

      expect(typeof estimator).toBe("function");
      expect(estimator(0)).toEqual({ hours: 0, minutes: 0 });
    });
  });

  // ── syncShielded ──────────────────────────────────────────────────

  describe("syncShielded()", () => {
    it("returns an Observable", () => {
      const client = createZCashClientWith(makeDeps(), { grpcUrl: GRPC_URL });
      expect(client.syncShielded(makeSyncArgs())).toBeInstanceOf(Observable);
    });

    // ── Validation error ──────────────────────────────────────────

    describe("validation error", () => {
      it("errors immediately when validateStartSyncArgs returns a string", done => {
        const validationMsg = "error: invalid negative arg startBlockHeight";
        const deps = makeDeps({
          validateStartSyncArgs: jest.fn().mockReturnValue(validationMsg),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });

        client.syncShielded(makeSyncArgs({ startBlockHeight: -1 })).subscribe({
          next: () => done.fail("should not emit"),
          error: err => {
            expect(err).toBe(validationMsg);
            expect(deps.startSyncJob).not.toHaveBeenCalled();
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });
    });

    // ── Happy path ────────────────────────────────────────────────

    describe("happy path", () => {
      it("emits rehydrated results when startSyncJob calls onChunk", done => {
        const rawChunk = makeRawChunk({ processedBlocks: 250, remainingBlocks: 250 });
        const rehydrated = makeRehydrated({ processedBlocks: 250, remainingBlocks: 250 });
        const deps = makeDeps({
          rehydrateSyncResult: jest.fn().mockReturnValue(rehydrated),
          startSyncJob: jest.fn(
            (
              _jobArgs: StartSyncJobArgs,
              onChunk: (chunk: ShieldedSyncResultRaw) => void,
              _hooks: SyncJobHooks,
            ) => {
              onChunk(rawChunk);
              return Promise.resolve();
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const emitted: ShieldedSyncResult[] = [];

        client.syncShielded(makeSyncArgs()).subscribe({
          next: v => emitted.push(v),
          error: err => done.fail(`unexpected error: ${err}`),
          complete: () => {
            expect(emitted).toHaveLength(1);
            expect(emitted[0]).toBe(rehydrated);
            expect(deps.rehydrateSyncResult).toHaveBeenCalledWith(rawChunk);
            done();
          },
        });
      });

      it("passes correct jobArgs to startSyncJob", done => {
        const deps = makeDeps();
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL, network: "testnet" });

        client
          .syncShielded(
            makeSyncArgs({ startBlockHeight: 42, viewingKey: "vk42", maxBatchSize: 100 }),
          )
          .subscribe({
            complete: () => {
              expect(deps.startSyncJob).toHaveBeenCalledTimes(1);
              const mockStartSyncJob = deps.startSyncJob as jest.Mock;
              const [jobArgs]: [StartSyncJobArgs] = mockStartSyncJob.mock.calls[0];
              expect(jobArgs).toEqual({
                grpcUrl: GRPC_URL,
                network: "testnet",
                viewingKey: "vk42",
                startBlockHeight: 42,
                maxBatchSize: 100,
              });
              done();
            },
            error: err => done.fail(`unexpected error: ${err}`),
          });
      });

      it("emits multiple chunks in order", done => {
        const raw1 = makeRawChunk({ processedBlocks: 100, remainingBlocks: 400 });
        const raw2 = makeRawChunk({ processedBlocks: 200, remainingBlocks: 300 });
        const reh1 = makeRehydrated({ processedBlocks: 100, remainingBlocks: 400 });
        const reh2 = makeRehydrated({ processedBlocks: 200, remainingBlocks: 300 });

        const deps = makeDeps({
          rehydrateSyncResult: jest.fn().mockReturnValueOnce(reh1).mockReturnValueOnce(reh2),
          startSyncJob: jest.fn(
            (_jobArgs: StartSyncJobArgs, onChunk: (chunk: ShieldedSyncResultRaw) => void) => {
              onChunk(raw1);
              onChunk(raw2);
              return Promise.resolve();
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const emitted: ShieldedSyncResult[] = [];

        client.syncShielded(makeSyncArgs()).subscribe({
          next: v => emitted.push(v),
          error: err => done.fail(`unexpected error: ${err}`),
          complete: () => {
            expect(emitted).toEqual([reh1, reh2]);
            done();
          },
        });
      });
    });

    // ── Completion ────────────────────────────────────────────────

    describe("completion", () => {
      it("completes after startSyncJob resolves", done => {
        const client = createZCashClientWith(makeDeps(), { grpcUrl: GRPC_URL });
        client.syncShielded(makeSyncArgs()).subscribe({
          complete: () => done(),
          error: err => done.fail(`unexpected error: ${err}`),
        });
      });
    });

    // ── Error propagation ─────────────────────────────────────────

    describe("error propagation", () => {
      it("errors when startSyncJob rejects", done => {
        const jobError = new Error("native engine crashed");
        const deps = makeDeps({
          startSyncJob: jest.fn().mockRejectedValue(jobError),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });

        client.syncShielded(makeSyncArgs()).subscribe({
          next: () => done.fail("should not emit"),
          error: err => {
            expect(err).toBe(jobError);
            done();
          },
          complete: () => done.fail("should not complete"),
        });
      });
    });

    // ── Teardown / cancellation ───────────────────────────────────

    describe("teardown / cancellation", () => {
      it("unsubscribing causes isCancelled to return true", async () => {
        let capturedHooks: SyncJobHooks | undefined;
        const deps = makeDeps({
          startSyncJob: jest.fn(
            (
              _jobArgs: StartSyncJobArgs,
              _onChunk: (chunk: ShieldedSyncResultRaw) => void,
              hooks: SyncJobHooks,
            ) => {
              capturedHooks = hooks;
              return new Promise(() => {}); // never resolves
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const sub = client.syncShielded(makeSyncArgs()).subscribe();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(capturedHooks).toBeDefined();
        expect(capturedHooks!.isCancelled()).toBe(false);

        sub.unsubscribe();

        expect(capturedHooks!.isCancelled()).toBe(true);
      });

      it("teardown calls activeStream.cancel() when a stream is active", async () => {
        const mockCancel = jest.fn();
        const deps = makeDeps({
          startSyncJob: jest.fn(
            (
              _jobArgs: StartSyncJobArgs,
              _onChunk: (chunk: ShieldedSyncResultRaw) => void,
              hooks: SyncJobHooks,
            ) => {
              hooks.onActiveStream?.({ cancel: mockCancel });
              return new Promise(() => {});
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const sub = client.syncShielded(makeSyncArgs()).subscribe();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockCancel).not.toHaveBeenCalled();
        sub.unsubscribe();
        expect(mockCancel).toHaveBeenCalledTimes(1);
      });

      it("teardown handles stream.cancel() throwing gracefully", async () => {
        const mockCancel = jest.fn(() => {
          throw new Error("cancel failed");
        });
        const deps = makeDeps({
          startSyncJob: jest.fn(
            (
              _jobArgs: StartSyncJobArgs,
              _onChunk: (chunk: ShieldedSyncResultRaw) => void,
              hooks: SyncJobHooks,
            ) => {
              hooks.onActiveStream?.({ cancel: mockCancel });
              return new Promise(() => {});
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const sub = client.syncShielded(makeSyncArgs()).subscribe();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(() => sub.unsubscribe()).not.toThrow();
        expect(mockCancel).toHaveBeenCalledTimes(1);
      });

      it("does not emit after cancellation", async () => {
        let capturedOnChunk: ((chunk: ShieldedSyncResultRaw) => void) | undefined;
        const deps = makeDeps({
          rehydrateSyncResult: jest.fn().mockReturnValue(makeRehydrated()),
          startSyncJob: jest.fn(
            (
              _jobArgs: StartSyncJobArgs,
              onChunk: (chunk: ShieldedSyncResultRaw) => void,
              _hooks: SyncJobHooks,
            ) => {
              capturedOnChunk = onChunk;
              return new Promise(() => {});
            },
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        const emitted: ShieldedSyncResult[] = [];
        const sub = client.syncShielded(makeSyncArgs()).subscribe({ next: v => emitted.push(v) });

        await new Promise(resolve => setTimeout(resolve, 0));

        capturedOnChunk!(makeRawChunk());
        expect(emitted).toHaveLength(1);

        sub.unsubscribe();

        capturedOnChunk!(makeRawChunk({ processedBlocks: 999 }));
        expect(emitted).toHaveLength(1);
      });

      it("does not complete after cancellation when startSyncJob resolves", async () => {
        let resolveJob!: () => void;
        const deps = makeDeps({
          startSyncJob: jest.fn(
            () =>
              new Promise<void>(resolve => {
                resolveJob = resolve;
              }),
          ),
        });
        const client = createZCashClientWith(deps, { grpcUrl: GRPC_URL });
        let completed = false;
        const sub = client.syncShielded(makeSyncArgs()).subscribe({
          complete: () => {
            completed = true;
          },
        });

        await new Promise(resolve => setTimeout(resolve, 0));

        sub.unsubscribe();
        resolveJob();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(completed).toBe(false);
      });
    });
  });
});
