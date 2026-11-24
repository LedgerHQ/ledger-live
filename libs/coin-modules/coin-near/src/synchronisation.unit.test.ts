import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { setCoinConfig, type NearConfig } from "./config";
import {
  fetchAccountDetails,
  fetchLegacyHistory,
  getAccount,
  getAccountStateFingerprint,
} from "./network";
import { getAccountShape, sync } from "./synchronisation";
import { mockNearConfig } from "./test/context";
import { HISTORY_RECHECK_WINDOW_MS } from "./constants";
import type { NearAccount, NearResources } from "./types";

jest.mock("./network", () => ({
  fetchAccountDetails: jest.fn(),
  fetchLegacyHistory: jest.fn(),
  getAccount: jest.fn(),
  getAccountStateFingerprint: jest.fn(),
}));

const ADDRESS = "delegator.near";
const KNOWN_POOL = "known.poolv1.near";
const NEW_POOL = "new.poolv1.near";
const STORED_FP = "fp-stored";
const NEW_FP = "fp-new";

const operation = (hash: string): Operation =>
  ({
    id: `id-${hash}`,
    hash,
    accountId: "js:2:near:delegator.near:",
    type: "OUT",
    value: new BigNumber(1),
    fee: new BigNumber(0),
    senders: [ADDRESS],
    recipients: [],
    blockHash: null,
    blockHeight: 1,
    date: new Date(1_700_000_000_000),
    extra: {},
  }) as unknown as Operation;

const position = (validatorId: string) => ({
  validatorId,
  staked: new BigNumber(1),
  available: new BigNumber(0),
  pending: new BigNumber(0),
});

const resources = (overrides: Partial<NearResources> = {}): NearResources => ({
  stakedBalance: new BigNumber(1),
  availableBalance: new BigNumber(0),
  pendingBalance: new BigNumber(0),
  storageUsageBalance: new BigNumber(0),
  stakingPositions: [position(KNOWN_POOL)],
  ...overrides,
});

const storedAccount = (
  overrides: { resources?: Partial<NearResources>; pending?: Operation[] } = {},
): NearAccount =>
  ({
    operations: [operation("old")],
    pendingOperations: overrides.pending ?? [],
    nearResources: resources({ accountStateFingerprint: STORED_FP, ...overrides.resources }),
  }) as unknown as NearAccount;

const history = (
  hashes: string[],
  extra: {
    stakingPoolsCalled?: Map<string, string>;
    isFullPage?: boolean;
    outcomePendingHashes?: string[];
    relayedHashes?: string[];
  } = {},
) => ({
  operations: hashes.map(operation),
  stakingPoolsCalled: extra.stakingPoolsCalled ?? new Map<string, string>(),
  isFullPage: extra.isFullPage ?? false,
  outcomePendingHashes: extra.outcomePendingHashes ?? [],
  relayedHashes: extra.relayedHashes ?? [],
});

const runSync = (initialAccount?: NearAccount) =>
  getAccountShape(
    {
      address: ADDRESS,
      initialAccount,
      currency: { id: "near" },
      derivationMode: "",
    } as never,
    { blacklistedTokenIds: [] } as never,
  );

const useConfig = (syncConfig?: NearConfig["sync"]) =>
  setCoinConfig(() => ({ ...mockNearConfig, ...(syncConfig && { sync: syncConfig }) }));

const NOW = 1_800_000_000_000;

const stakingOptionsOfLastCall = () => (getAccount as jest.Mock).mock.calls.at(-1)?.[2];

describe("legacy getAccountShape", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    useConfig();
    (fetchAccountDetails as jest.Mock).mockResolvedValue({ amount: "1" });
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(STORED_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history([]));
    (getAccount as jest.Mock).mockResolvedValue({
      blockHeight: 1,
      balance: new BigNumber(1),
      spendableBalance: new BigNumber(1),
      nearResources: resources(),
      poolListingFailed: false,
      failedCandidates: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads neither the history nor the listing when the fingerprint is unchanged", async () => {
    const shape = await runSync(storedAccount());

    expect(fetchLegacyHistory).not.toHaveBeenCalled();
    expect(stakingOptionsOfLastCall()).toMatchObject({
      knownValidatorIds: [KNOWN_POOL],
      listValidators: false,
    });
    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(shape.operations).toHaveLength(1);
  });

  it("reads the history but not the listing for a changed state with a plain operation", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"]));

    const shape = await runSync(storedAccount());

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().listValidators).toBe(false);
    expect(shape.operations).toHaveLength(2);
    expect(shape.nearResources?.accountStateFingerprint).toBe(NEW_FP);
    expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
  });

  it("lists the pools for an unseen staking call to an unknown pool, naming it as a candidate", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["new"], { stakingPoolsCalled: new Map([["new", NEW_POOL]]) }),
    );

    const shape = await runSync(storedAccount());

    expect(stakingOptionsOfLastCall()).toMatchObject({
      knownValidatorIds: [KNOWN_POOL],
      listValidators: true,
      candidateValidatorIds: [NEW_POOL],
    });
    expect(shape.nearResources).not.toHaveProperty("poolListingPending");
  });

  it("stores the listing marker when a needed listing fails, then lists on the next unchanged sync", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["new"], { stakingPoolsCalled: new Map([["new", NEW_POOL]]) }),
    );
    (getAccount as jest.Mock).mockResolvedValueOnce({
      blockHeight: 1,
      balance: new BigNumber(2),
      spendableBalance: new BigNumber(1),
      nearResources: resources({ stakingPositions: [position(KNOWN_POOL), position(NEW_POOL)] }),
      poolListingFailed: true,
      failedCandidates: [],
    });

    const first = await runSync(storedAccount());

    expect(first.nearResources?.poolListingPending).toBe(true);
    expect(first.nearResources?.accountStateFingerprint).toBe(NEW_FP);

    const second = await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount);

    // The second history read is the confirmation read after the change accepted on "new".
    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(stakingOptionsOfLastCall()).toMatchObject({
      knownValidatorIds: [KNOWN_POOL, NEW_POOL],
      listValidators: true,
      candidateValidatorIds: [],
    });
    expect(second.nearResources).not.toHaveProperty("poolListingPending");
  });

  it("does not list the pools for an unseen staking call to a known pool", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["new"], { stakingPoolsCalled: new Map([["new", KNOWN_POOL]]) }),
    );

    await runSync(storedAccount());

    expect(stakingOptionsOfLastCall().listValidators).toBe(false);
  });

  it("ignores a staking call whose transaction was already seen", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["old", "new"], { stakingPoolsCalled: new Map([["old", NEW_POOL]]) }),
    );

    await runSync(storedAccount());

    expect(stakingOptionsOfLastCall().listValidators).toBe(false);
  });

  it("lists the pools when a full page of unseen operations comes back", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"], { isFullPage: true }));

    await runSync(storedAccount());

    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
  });

  it("lists the pools again on the confirmation read of a full page", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"], { isFullPage: true }));

    await runSync(storedAccount({ resources: { historyConfirmPending: true } }));

    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
  });

  it("does not list the pools on the confirmation read of a partial page", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

    await runSync(storedAccount({ resources: { historyConfirmPending: true } }));

    expect(stakingOptionsOfLastCall().listValidators).toBe(false);
  });

  it("keeps the stored operations and fingerprint, and lists the pools, when the history fails", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync(storedAccount({ pending: [operation("pending")] }));

    expect(shape.operations?.map(o => o.hash)).toEqual(["old"]);
    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
  });

  it("fails a first sync when the history fails", async () => {
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("503"));

    await expect(runSync()).rejects.toThrow("503");
  });

  it("reads the history and lists the pools on a first sync, storing the fingerprint", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"]));

    const shape = await runSync();

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().knownValidatorIds).toBeUndefined();
    expect(stakingOptionsOfLastCall().listValidators).toBeUndefined();
    expect(shape.nearResources?.accountStateFingerprint).toBe(NEW_FP);
  });

  it("names the pools of the history's staking calls as candidates on a first sync, with no known pools", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["stake"], { stakingPoolsCalled: new Map([["stake", NEW_POOL]]) }),
    );

    await runSync();

    expect(stakingOptionsOfLastCall().knownValidatorIds).toBeUndefined();
    expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([NEW_POOL]);
  });

  it("keeps the fingerprint while the state change is unexplained, within the recheck window", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);

    const first = await runSync(storedAccount());

    expect(first.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(first.nearResources?.historyRecheckSince).toBe(NOW);
    expect(first.nearResources?.historyRecheckFingerprint).toBe(NEW_FP);

    jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS - 1);
    const second = await runSync({
      ...storedAccount(),
      nearResources: first.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(second.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(second.nearResources?.historyRecheckSince).toBe(NOW);
  });

  it("accepts the new fingerprint once the recheck window has passed", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

    const shape = await runSync(
      storedAccount({ resources: { historyRecheckSince: NOW, historyRecheckFingerprint: NEW_FP } }),
    );

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(shape.nearResources?.accountStateFingerprint).toBe(NEW_FP);
    expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
    expect(shape.nearResources).not.toHaveProperty("historyRecheckFingerprint");
  });

  it("restarts the recheck window when the state changes again during a recheck", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue("fp-newer");

    const shape = await runSync(
      storedAccount({
        resources: {
          historyRecheckSince: NOW - HISTORY_RECHECK_WINDOW_MS,
          historyRecheckFingerprint: NEW_FP,
        },
      }),
    );

    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(shape.nearResources?.historyRecheckSince).toBe(NOW);
    expect(shape.nearResources?.historyRecheckFingerprint).toBe("fp-newer");
  });

  it("accepts the new fingerprint during a recheck as soon as an unseen operation comes back", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"]));

    const shape = await runSync(storedAccount({ resources: { historyRecheckSince: NOW - 1000 } }));

    expect(shape.operations).toHaveLength(2);
    expect(shape.nearResources?.accountStateFingerprint).toBe(NEW_FP);
    expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
  });

  it("keeps the recheck start time when the history fails during a recheck", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync(
      storedAccount({
        resources: { historyRecheckSince: NOW - 1000, historyRecheckFingerprint: NEW_FP },
      }),
    );

    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(shape.nearResources?.historyRecheckSince).toBe(NOW - 1000);
    expect(shape.nearResources?.historyRecheckFingerprint).toBe(NEW_FP);
  });

  it("reads the history once more after a change accepted on new operations, finding a late one", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first"]));
    const first = await runSync(storedAccount());

    expect(first.nearResources?.accountStateFingerprint).toBe(NEW_FP);
    expect(first.nearResources?.historyConfirmPending).toBe(true);

    // The indexer has caught up with the second transfer behind the same state change.
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first", "second"]));
    const second = await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(second.operations?.map(op => op.hash).sort()).toEqual(["first", "old", "second"]);
    expect(second.nearResources?.historyConfirmPending).toBe(true);

    const third = await runSync({
      ...storedAccount(),
      operations: second.operations,
      nearResources: second.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(3);
    expect(third.nearResources).not.toHaveProperty("historyConfirmPending");

    await runSync({
      ...storedAccount(),
      operations: third.operations,
      nearResources: third.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(3);
  });

  it("only reads once more when the app did not save a cleared confirmation marker", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first"]));
    const first = await runSync(storedAccount());
    const stored = {
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount;
    const second = await runSync(stored);
    expect(second.nearResources).not.toHaveProperty("historyConfirmPending");

    // Clearing the marker changed nothing else, so the app kept the first sync: after a restart,
    // the stored marker is the older one. It reads once more and ends the same way.
    const replayed = await runSync(stored);
    expect(fetchLegacyHistory).toHaveBeenCalledTimes(3);
    expect(replayed.nearResources).not.toHaveProperty("historyConfirmPending");
    expect(replayed.operations?.map(op => op.hash)).toEqual(second.operations?.map(op => op.hash));
    expect(replayed.balance).toEqual(second.balance);
  });

  it("stores an operation the confirmation reads below every stored one, then ends", async () => {
    const late = { ...operation("late"), date: new Date(1_600_000_000_000) };
    (fetchLegacyHistory as jest.Mock).mockResolvedValue({
      ...history(["old"]),
      operations: [operation("old"), late],
    });
    const account = storedAccount({ resources: { historyConfirmPending: true } });

    const first = await runSync(account);
    expect(first.operations?.map(({ hash }) => hash)).toEqual(["old", "late"]);
    expect(first.nearResources?.historyConfirmPending).toBe(true);

    const second = await runSync({ ...account, ...first } as NearAccount);
    expect(second.operations?.map(({ hash }) => hash)).toEqual(["old", "late"]);
    expect(second.nearResources?.historyConfirmPending).toBeUndefined();
  });

  it("keeps the confirmation marker when the confirmation read fails", async () => {
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync(storedAccount({ resources: { historyConfirmPending: true } }));

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(shape.nearResources?.historyConfirmPending).toBe(true);
  });

  it("stores the newest stored operation as the confirmation boundary and reads up to it", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first"]));
    const first = await runSync(storedAccount());

    expect(first.nearResources?.historyConfirmBoundary).toBe("old");

    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first"]));
    await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount);

    const untilHashes = (fetchLegacyHistory as jest.Mock).mock.calls.at(-1)?.[4] as Set<string>;
    expect(untilHashes.has("old")).toBe(true);
  });

  it("keeps the earlier boundary when the confirmation finds more new operations", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first", "second"]));

    const shape = await runSync(
      storedAccount({
        resources: { historyConfirmPending: true, historyConfirmBoundary: "older" },
      }),
    );

    expect(shape.nearResources?.historyConfirmBoundary).toBe("older");
    expect(shape.nearResources?.historyConfirmPending).toBe(true);
  });

  it("clears the boundary with a complete confirmation", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

    const shape = await runSync(
      storedAccount({ resources: { historyConfirmPending: true, historyConfirmBoundary: "old" } }),
    );

    expect(shape.nearResources).not.toHaveProperty("historyConfirmPending");
    expect(shape.nearResources).not.toHaveProperty("historyConfirmBoundary");
  });

  it("keeps the boundary when the confirmation read fails", async () => {
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync(
      storedAccount({ resources: { historyConfirmPending: true, historyConfirmBoundary: "old" } }),
    );

    expect(shape.nearResources?.historyConfirmPending).toBe(true);
    expect(shape.nearResources?.historyConfirmBoundary).toBe("old");
  });

  it("stores no boundary when the read replaced the history across a gap", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue({ ...history(["first"]), gap: true });

    const shape = await runSync(storedAccount());

    expect(shape.nearResources).not.toHaveProperty("historyConfirmBoundary");
  });

  it("reads the history once more after a first sync, finding a transfer the indexer lagged on", async () => {
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first"]));
    const first = await runSync();

    expect(first.nearResources?.historyConfirmPending).toBe(true);

    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["first", "late"]));
    const second = await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(second.operations?.map(op => op.hash).sort()).toEqual(["first", "late"]);
  });

  it("stores no confirmation marker after a first sync with an empty history", async () => {
    const shape = await runSync();

    expect(shape.nearResources).not.toHaveProperty("historyConfirmPending");
  });

  it("fails the sync when the history fails for a known account without stored operations", async () => {
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    await expect(
      runSync({ ...storedAccount(), operations: [] } as unknown as NearAccount),
    ).rejects.toThrow("429");
  });

  it("keeps an account unknown to the node empty when its history fails", async () => {
    (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync({ ...storedAccount(), operations: [] } as unknown as NearAccount);

    expect(shape.operations).toEqual([]);
  });

  it("keeps the fingerprint of an account unknown to the node, so its unchanged state skips the history", async () => {
    (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);
    const first = await runSync();

    expect(first.nearResources?.historyEmpty).toBe(true);

    jest.clearAllMocks();
    const second = await runSync({
      operations: [],
      pendingOperations: [],
      nearResources: first.nearResources,
    } as unknown as NearAccount);

    expect(fetchLegacyHistory).not.toHaveBeenCalled();
    expect(stakingOptionsOfLastCall()).toMatchObject({ listValidators: false });
    expect(second.nearResources?.historyEmpty).toBe(true);
    expect(second.nearResources?.accountStateFingerprint).toBe(STORED_FP);
  });

  it("reads the history of an empty account once its state changes, and drops the marker on new operations", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"]));

    const shape = await runSync({
      ...storedAccount({ resources: { historyEmpty: true } }),
      operations: [],
    } as unknown as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(shape.operations).toHaveLength(1);
    expect(shape.nearResources).not.toHaveProperty("historyEmpty");
  });

  it("reads the history after a cleared cache of an account that had operations", async () => {
    const shape = await runSync({ ...storedAccount(), operations: [] } as unknown as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall()).toMatchObject({ listValidators: true });
    expect(shape.nearResources).not.toHaveProperty("historyEmpty");
  });

  it("reads again the empty history of an account the node knows, until the lagging indexer returns it", async () => {
    const first = await runSync();

    expect(first.nearResources).not.toHaveProperty("historyEmpty");

    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["funding"]));
    const second = await runSync({
      operations: [],
      pendingOperations: [],
      nearResources: first.nearResources,
    } as unknown as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(second.operations).toHaveLength(1);
  });

  it("keeps the empty marker when the history of an unknown account fails", async () => {
    (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync({
      ...storedAccount({ resources: { historyEmpty: true } }),
      operations: [],
    } as unknown as NearAccount);

    expect(shape.nearResources?.historyEmpty).toBe(true);
  });

  it("stores the candidate pools whose read failed, and reads them again on an unchanged sync", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["new"], { stakingPoolsCalled: new Map([["new", NEW_POOL]]) }),
    );
    (getAccount as jest.Mock).mockResolvedValueOnce({
      blockHeight: 1,
      balance: new BigNumber(1),
      spendableBalance: new BigNumber(1),
      nearResources: resources(),
      poolListingFailed: false,
      failedCandidates: [NEW_POOL],
    });

    const first = await runSync(storedAccount());

    expect(first.nearResources?.pendingCandidatePools).toEqual([NEW_POOL]);

    // The staking call is now stored: only the pending list still names the pool.
    (fetchLegacyHistory as jest.Mock).mockClear();
    (getAccount as jest.Mock).mockResolvedValueOnce({
      blockHeight: 1,
      balance: new BigNumber(1),
      spendableBalance: new BigNumber(1),
      nearResources: resources({ stakingPositions: [position(KNOWN_POOL), position(NEW_POOL)] }),
      poolListingFailed: false,
      failedCandidates: [],
    });
    const second = await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: { ...first.nearResources, historyConfirmPending: undefined },
    } as unknown as NearAccount);

    expect(fetchLegacyHistory).not.toHaveBeenCalled();
    expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([NEW_POOL]);
    expect(second.nearResources).not.toHaveProperty("pendingCandidatePools");
  });

  it("reads the history and lists the pools for a stored account without operations (cleared cache)", async () => {
    const cleared = { ...storedAccount(), operations: [] } as unknown as NearAccount;
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

    const shape = await runSync(cleared);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
    expect(shape.operations?.map(o => o.hash)).toEqual(["old"]);
    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
  });

  it("reads the history for a pending operation although the state is unchanged", async () => {
    await runSync(storedAccount({ pending: [operation("pending")] }));

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().listValidators).toBe(false);
  });

  it("reads the history, lists the pools and schedules one confirmation read for an account stored without a fingerprint", async () => {
    const legacy = storedAccount();
    delete legacy.nearResources.accountStateFingerprint;

    const shape = await runSync(legacy);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
    expect(shape.nearResources?.historyConfirmPending).toBe(true);
  });

  it("finds a transfer the indexer lagged on, on the read after the first fingerprint", async () => {
    const legacy = storedAccount();
    delete legacy.nearResources.accountStateFingerprint;
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));
    const first = await runSync(legacy);

    (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old", "late"]));
    const second = await runSync({
      ...storedAccount(),
      operations: first.operations,
      nearResources: first.nearResources,
    } as NearAccount);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(2);
    expect(second.operations?.map(op => op.hash).sort()).toEqual(["late", "old"]);
  });

  it("reads the pools of the generic bridge's positions as known pools after a switch back", async () => {
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
    // The generic bridge stored the staking call; its positions name the pool.
    (fetchLegacyHistory as jest.Mock).mockResolvedValue(
      history(["old"], { stakingPoolsCalled: new Map([["old", NEW_POOL]]) }),
    );
    const switchedBack = {
      ...storedAccount(),
      stakingPositions: [{ delegate: NEW_POOL }, { delegate: KNOWN_POOL }, {}],
    } as unknown as NearAccount;

    await runSync(switchedBack);

    expect(stakingOptionsOfLastCall().knownValidatorIds).toEqual([KNOWN_POOL, NEW_POOL]);
  });

  describe("sync.stateDriven", () => {
    it("reads the history and lists the pools on an unchanged fingerprint when false", async () => {
      useConfig({ stateDriven: false });

      const shape = await runSync(storedAccount());

      expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      expect(stakingOptionsOfLastCall()).toMatchObject({
        knownValidatorIds: [KNOWN_POOL],
        listValidators: true,
      });
      expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    });

    it("stores the new fingerprint without a recheck when false", async () => {
      useConfig({ stateDriven: false });
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);

      const shape = await runSync(storedAccount());

      expect(shape.nearResources?.accountStateFingerprint).toBe(NEW_FP);
      expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
    });

    it("behaves as true when the toggle is absent", async () => {
      useConfig({});

      await runSync(storedAccount());

      expect(fetchLegacyHistory).not.toHaveBeenCalled();
    });
  });

  describe("a candidate pool that shows no position", () => {
    const pending = (extra: Partial<NearResources> = {}) =>
      storedAccount({
        resources: { pendingCandidatePools: [NEW_POOL], pendingCandidatesSince: NOW, ...extra },
      });

    it("stays a candidate, read on the node only, within the hour", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + 30 * 60 * 1000);

      const shape = await runSync(pending());

      expect(fetchLegacyHistory).not.toHaveBeenCalled();
      expect(stakingOptionsOfLastCall()).toMatchObject({
        candidateValidatorIds: [NEW_POOL],
        listValidators: false,
      });
      expect(shape.nearResources?.pendingCandidatePools).toEqual([NEW_POOL]);
      expect(shape.nearResources?.pendingCandidatesSince).toBe(NOW);
    });

    it("is dropped once the hour has passed", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

      const shape = await runSync(pending());

      expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([]);
      expect(shape.nearResources).not.toHaveProperty("pendingCandidatePools");
      expect(shape.nearResources).not.toHaveProperty("pendingCandidatesSince");
    });

    const named = (date: Date) => {
      const named = history(["new"], { stakingPoolsCalled: new Map([["new", NEW_POOL]]) });
      named.operations[0].date = date;
      return named;
    };

    it("is kept from the first time a recent staking call named it", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(named(new Date(NOW - 60_000)));

      const shape = await runSync(storedAccount());

      expect(shape.nearResources?.pendingCandidatePools).toEqual([NEW_POOL]);
      expect(shape.nearResources?.pendingCandidatesSince).toBe(NOW);
    });

    it("probes a known pool a recent call names while the read shows no position for it", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      const call = history(["new"], { stakingPoolsCalled: new Map([["new", KNOWN_POOL]]) });
      call.operations[0].date = new Date(NOW - 60_000);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(call);
      (getAccount as jest.Mock).mockResolvedValue({
        blockHeight: 1,
        balance: new BigNumber(1),
        spendableBalance: new BigNumber(1),
        nearResources: resources({ stakingPositions: [] }),
        poolListingFailed: false,
        failedCandidates: [],
      });

      const shape = await runSync(storedAccount());

      expect(stakingOptionsOfLastCall()).toMatchObject({
        candidateValidatorIds: [KNOWN_POOL],
        listValidators: false,
      });
      expect(shape.nearResources?.pendingCandidatePools).toEqual([KNOWN_POOL]);
    });

    it("is kept on a first sync when a recent staking call named it", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(named(new Date(NOW - 60_000)));

      const shape = await runSync(undefined);

      expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([NEW_POOL]);
      expect(shape.nearResources?.pendingCandidatePools).toEqual([NEW_POOL]);
    });

    it("starts a fresh hour when a new pool joins a waiting one", async () => {
      const OTHER_POOL = "other.poolv1.near";
      const joinedAt = NOW + 59 * 60 * 1000;
      jest.spyOn(Date, "now").mockReturnValue(joinedAt);
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      const call = history(["new"], { stakingPoolsCalled: new Map([["new", OTHER_POOL]]) });
      call.operations[0].date = new Date(joinedAt - 60_000);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(call);

      const shape = await runSync(pending());

      expect(shape.nearResources?.pendingCandidatePools).toEqual([NEW_POOL, OTHER_POOL]);
      expect(shape.nearResources?.pendingCandidatesSince).toBe(joinedAt);
    });

    it("takes over the candidates a generic sync left, with their hour", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + 10 * 60 * 1000);
      const switched = {
        ...storedAccount(),
        historyRecheck: { reason: "pools", validatorIds: [NEW_POOL], validatorsSince: NOW },
      } as unknown as NearAccount;

      const shape = await runSync(switched);

      expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([NEW_POOL]);
      expect(shape.nearResources?.pendingCandidatePools).toEqual([NEW_POOL]);
      expect(shape.nearResources?.pendingCandidatesSince).toBe(NOW);
      expect(shape).toHaveProperty("historyRecheck", undefined);
    });

    it.each(["failed", "unexplained", "confirm"] as const)(
      "reads the history a generic sync owed with a %s mark",
      async reason => {
        const switched = {
          ...storedAccount(),
          historyRecheck: { reason, since: NOW },
        } as unknown as NearAccount;

        await runSync(switched);

        expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      },
    );

    it("reads the range a generic confirmation owed whole, and keeps what it did not reach", async () => {
      const ops = [
        { ...operation("top"), blockHeight: 30 },
        { ...operation("mid"), blockHeight: 20 },
        { ...operation("low"), blockHeight: 10 },
      ];
      const switched = {
        ...storedAccount(),
        operations: ops,
        historyRecheck: { reason: "confirm", minHeight: 20, unsettledSince: NOW - 60_000 },
      } as unknown as NearAccount;
      // The first page holds only the newest known transaction.
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["top"]));

      const shape = await runSync(switched);

      expect((fetchLegacyHistory as jest.Mock).mock.calls[0][4]).toEqual(new Set(["top", "mid"]));
      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["mid"]);
      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW - 60_000);
      expect(shape).toHaveProperty("historyRecheck", undefined);
    });

    it("goes on with the failure run a generic sync started", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("503"));
      const switched = {
        ...storedAccount(),
        historyRecheck: { reason: "failed", failedSince: NOW },
      } as unknown as NearAccount;

      await expect(runSync(switched)).rejects.toThrow("503");
    });

    it("keeps the failure time a generic sync started while the hour lasts", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + 10 * 60 * 1000);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("503"));
      const switched = {
        ...storedAccount(),
        historyRecheck: { reason: "failed", failedSince: NOW },
      } as unknown as NearAccount;

      const shape = await runSync(switched);

      expect(shape.nearResources?.historyFailedSince).toBe(NOW);
    });

    it("reads the generic window, not legacy marks left from before the generic sync", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + 2 * HISTORY_RECHECK_WINDOW_MS);
      const genericSince = NOW + 2 * HISTORY_RECHECK_WINDOW_MS - 60_000;
      const switched = {
        ...storedAccount({
          resources: { historyUnsettledSince: NOW, historyUnsettledHashes: ["stale"] },
        }),
        syncHash: "0xgeneric",
        operations: [{ ...operation("pending"), blockHeight: 20 }],
        historyRecheck: { reason: "confirm", minHeight: 20, unsettledSince: genericSince },
      } as unknown as NearAccount;
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["pending"], { outcomePendingHashes: ["pending"] }),
      );

      const shape = await runSync(switched);

      expect((fetchLegacyHistory as jest.Mock).mock.calls[0][4]).toEqual(new Set(["pending"]));
      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["pending"]);
      expect(shape.nearResources?.historyUnsettledSince).toBe(genericSince);
    });

    it("starts a new failure run when only a legacy run from before the generic sync is stored", async () => {
      const at = NOW + 2 * HISTORY_RECHECK_WINDOW_MS;
      jest.spyOn(Date, "now").mockReturnValue(at);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("503"));
      const switched = {
        ...storedAccount({ resources: { historyFailedSince: NOW } }),
        syncHash: "0xgeneric",
        historyRecheck: { reason: "unexplained", since: at },
      } as unknown as NearAccount;

      const shape = await runSync(switched);

      expect(shape.nearResources?.historyFailedSince).toBe(at);
    });

    it("lists the pools when a generic sync owed a listing", async () => {
      const switched = {
        ...storedAccount(),
        historyRecheck: { reason: "pools", listing: true },
      } as unknown as NearAccount;

      await runSync(switched);

      expect(fetchLegacyHistory).not.toHaveBeenCalled();
      expect(stakingOptionsOfLastCall().listValidators).toBe(true);
    });

    it("does not take over generic candidates past their hour", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);
      const switched = {
        ...storedAccount(),
        historyRecheck: { reason: "pools", validatorIds: [NEW_POOL], validatorsSince: NOW },
      } as unknown as NearAccount;

      const shape = await runSync(switched);

      expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([]);
      expect(shape.nearResources).not.toHaveProperty("pendingCandidatePools");
    });

    it("is not kept when the staking call that named it is more than an hour old", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        named(new Date(NOW - 2 * HISTORY_RECHECK_WINDOW_MS)),
      );

      const shape = await runSync(storedAccount());

      expect(stakingOptionsOfLastCall().candidateValidatorIds).toEqual([NEW_POOL]);
      expect(shape.nearResources).not.toHaveProperty("pendingCandidatePools");
    });
  });

  describe("a relayed staking call", () => {
    it("lists the pools, since its data does not name the pool", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["relayed"], { relayedHashes: ["relayed"] }),
      );

      await runSync(storedAccount());

      expect(stakingOptionsOfLastCall().listValidators).toBe(true);
    });

    it("does not list the pools for a relayed call that was already seen", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["old", "new"], { relayedHashes: ["old"] }),
      );

      await runSync(storedAccount());

      expect(stakingOptionsOfLastCall().listValidators).toBe(false);
    });
  });

  describe("a recheck window that ends with nothing found", () => {
    it("asks for one pool listing, which the next unchanged sync makes", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);
      const stored = storedAccount({
        resources: {
          historyRecheckSince: NOW,
          historyRecheckFingerprint: NEW_FP,
        },
      });

      const expired = await runSync(stored);

      expect(expired.nearResources?.poolListingPending).toBe(true);
      expect(expired.nearResources?.accountStateFingerprint).toBe(NEW_FP);

      (fetchLegacyHistory as jest.Mock).mockClear();
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      const next = await runSync({
        ...stored,
        nearResources: expired.nearResources,
      } as unknown as NearAccount);

      expect(fetchLegacyHistory).not.toHaveBeenCalled();
      expect(stakingOptionsOfLastCall().listValidators).toBe(true);
      expect(next.nearResources).not.toHaveProperty("poolListingPending");
    });
  });

  describe("an operation read before its outcome is indexed", () => {
    const unsettled = (since?: number) =>
      storedAccount({
        resources: {
          historyConfirmPending: true,
          ...(since !== undefined && {
            historyUnsettledSince: since,
            historyUnsettledHashes: ["old"],
          }),
        },
      });

    it("keeps the confirmation read going, from when it was first seen", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["old"], { outcomePendingHashes: ["old"] }),
      );
      jest.spyOn(Date, "now").mockReturnValue(NOW + 10 * 60 * 1000);

      const shape = await runSync(unsettled(NOW));

      expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      expect(shape.nearResources?.historyConfirmPending).toBe(true);
      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW);
    });

    it("keeps when it first saw the missing outcome through a failed read", async () => {
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("indexer down"));
      jest.spyOn(Date, "now").mockReturnValue(NOW + 30 * 60 * 1000);

      const shape = await runSync(unsettled(NOW));

      expect(shape.nearResources?.historyConfirmPending).toBe(true);
      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW);
    });

    it("stops once the outcome shows", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

      const shape = await runSync(unsettled(NOW));

      expect(shape.nearResources).not.toHaveProperty("historyConfirmPending");
      expect(shape.nearResources).not.toHaveProperty("historyUnsettledSince");
    });

    it("stops after the hour", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["old"], { outcomePendingHashes: ["old"] }),
      );
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

      const shape = await runSync(unsettled(NOW));

      expect(shape.nearResources).not.toHaveProperty("historyConfirmPending");
    });
  });

  describe("a stored operation whose outcome was missing", () => {
    const withHashes = (hashes: string[], since = NOW) =>
      storedAccount({
        resources: {
          historyConfirmPending: true,
          historyUnsettledSince: since,
          historyUnsettledHashes: hashes,
        },
      });

    it("starts a fresh hour when another operation is read without its outcome", async () => {
      const readAt = NOW + 59 * 60 * 1000;
      jest.spyOn(Date, "now").mockReturnValue(readAt);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["new", "old"], { outcomePendingHashes: ["new", "old"] }),
      );

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["new", "old"]);
      expect(shape.nearResources?.historyUnsettledSince).toBe(readAt);
    });

    it("names the operations read without an outcome", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["new"], { outcomePendingHashes: ["new"] }),
      );

      const shape = await runSync(storedAccount());

      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["new"]);
      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW);
    });

    it("is given the stored hashes, so the read pages until it reads them", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

      await runSync(withHashes(["old"]));

      expect(fetchLegacyHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        ADDRESS,
        new Set(["old"]),
        new Set(["old"]),
      );
    });

    it("keeps the recheck when the read did not reach it", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["newer"]));
      jest.spyOn(Date, "now").mockReturnValue(NOW + 10 * 60 * 1000);

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources?.historyConfirmPending).toBe(true);
      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["old"]);
      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW);
    });

    it("keeps the recheck when it was read and is still pending", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["old"], { outcomePendingHashes: ["old"] }),
      );

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources?.historyConfirmPending).toBe(true);
      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["old"]);
    });

    it("clears both fields once it was read with an outcome", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old"]));

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources).not.toHaveProperty("historyConfirmPending");
      expect(shape.nearResources).not.toHaveProperty("historyUnsettledSince");
      expect(shape.nearResources).not.toHaveProperty("historyUnsettledHashes");
    });

    it("keeps both fields through a failed read", async () => {
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("indexer down"));
      jest.spyOn(Date, "now").mockReturnValue(NOW + 30 * 60 * 1000);

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources?.historyUnsettledSince).toBe(NOW);
      expect(shape.nearResources?.historyUnsettledHashes).toEqual(["old"]);
    });

    it("clears both fields after the hour", async () => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["newer"]));
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

      const shape = await runSync(withHashes(["old"]));

      expect(shape.nearResources).not.toHaveProperty("historyUnsettledSince");
      expect(shape.nearResources).not.toHaveProperty("historyUnsettledHashes");
    });
  });

  describe("the sync updater", () => {
    const syncedAccount = (operations: Operation[]) =>
      ({
        id: "js:2:near:delegator.near:",
        currency: { id: "near", coinType: 397, family: "near" },
        derivationMode: "",
        freshAddress: ADDRESS,
        balance: new BigNumber(1),
        operations,
        pendingOperations: [],
        nearResources: resources({ accountStateFingerprint: STORED_FP }),
      }) as unknown as NearAccount;

    const applySync = async (initial: NearAccount) => {
      const updater = await new Promise<(account: NearAccount) => NearAccount>(
        (resolve, reject) => {
          sync(initial, { paginationConfig: {} } as never).subscribe({
            next: resolve,
            error: reject,
          });
        },
      );
      return updater(initial);
    };

    it("replaces the stored history when the read left a gap", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue({ ...history(["n1", "n2"]), gap: true });

      const synced = await applySync(syncedAccount([operation("old")]));

      expect(synced.operations.map(({ hash }) => hash)).toEqual(["n1", "n2"]);
    });

    it("keeps the old operations when the read joined them", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue({ ...history(["n1"]), gap: false });

      const synced = await applySync(syncedAccount([operation("old")]));

      expect(synced.operations.map(({ hash }) => hash).sort()).toEqual(["n1", "old"]);
    });
  });

  describe("a history read that keeps failing", () => {
    it("is tolerated, keeping when it first failed", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));
      jest.spyOn(Date, "now").mockReturnValue(NOW + 59 * 60 * 1000);

      const shape = await runSync(storedAccount({ resources: { historyFailedSince: NOW } }));

      expect(shape.operations).toHaveLength(1);
      expect(shape.nearResources?.historyFailedSince).toBe(NOW);
      expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    });

    it("opens its hour at the first failure", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

      const shape = await runSync(storedAccount());

      expect(shape.nearResources?.historyFailedSince).toBe(NOW);
    });

    it("fails the sync after the hour", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

      await expect(
        runSync(storedAccount({ resources: { historyFailedSince: NOW } })),
      ).rejects.toThrow("429");
    });

    it("keeps the read on after its first cause is gone, and the original start", async () => {
      // Unchanged fingerprint, no pending operation, no recheck: only the stored failure asks.
      (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));
      jest.spyOn(Date, "now").mockReturnValue(NOW + 10 * 60 * 1000);

      const shape = await runSync(storedAccount({ resources: { historyFailedSince: NOW } }));

      expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      expect(shape.nearResources?.historyFailedSince).toBe(NOW);
    });

    it("is cleared by a successful retry made only because of the stored failure", async () => {
      const shape = await runSync(storedAccount({ resources: { historyFailedSince: NOW } }));

      expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      expect(shape.nearResources).not.toHaveProperty("historyFailedSince");
    });

    it("forgets the failure once a read succeeds", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["new"]));

      const shape = await runSync(storedAccount({ resources: { historyFailedSince: NOW } }));

      expect(shape.nearResources).not.toHaveProperty("historyFailedSince");
    });
  });

  describe("an account the node knows whose history stays empty", () => {
    const cleared = (overrides: Partial<NearResources> = {}) =>
      ({ ...storedAccount({ resources: overrides }), operations: [] }) as unknown as NearAccount;

    beforeEach(() => {
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history([]));
    });

    it("is read again, for an hour from the first empty read", async () => {
      const first = await runSync(cleared());

      expect(first.nearResources?.historyEmptySince).toBe(NOW);
      expect(first.nearResources).not.toHaveProperty("historyEmpty");

      jest.spyOn(Date, "now").mockReturnValue(NOW + 30 * 60 * 1000);
      (fetchLegacyHistory as jest.Mock).mockClear();
      const second = await runSync(cleared({ historyEmptySince: NOW }));

      expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
      expect(second.nearResources?.historyEmptySince).toBe(NOW);
    });

    it("is then taken as empty, and no longer read while its state does not change", async () => {
      jest.spyOn(Date, "now").mockReturnValue(NOW + HISTORY_RECHECK_WINDOW_MS);

      const taken = await runSync(cleared({ historyEmptySince: NOW }));

      expect(taken.nearResources?.historyEmpty).toBe(true);
      expect(taken.nearResources).not.toHaveProperty("historyEmptySince");

      (fetchLegacyHistory as jest.Mock).mockClear();
      await runSync({ ...cleared(), nearResources: taken.nearResources } as unknown as NearAccount);

      expect(fetchLegacyHistory).not.toHaveBeenCalled();
    });
  });

  describe("the fingerprint and the key nonces", () => {
    it("is given the stored fingerprint, so a failed key read keeps its nonces", async () => {
      await runSync(storedAccount());

      expect(getAccountStateFingerprint).toHaveBeenCalledWith(
        expect.anything(),
        ADDRESS,
        expect.anything(),
        STORED_FP,
      );
    });
  });

  describe("the history read", () => {
    it("replaces the stored history when the bounded read did not reach it", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue({ ...history(["n1", "n2"]), gap: true });

      const shape = await runSync(storedAccount());

      expect(shape.operations?.map(({ hash }) => hash)).toEqual(["n1", "n2"]);
    });

    it("merges the read with the stored history when it reached it", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue({ ...history(["n1"]), gap: false });

      const shape = await runSync(storedAccount());

      expect(shape.operations?.map(({ hash }) => hash)).toEqual(
        expect.arrayContaining(["n1", "old"]),
      );
    });

    it("is given the hashes already stored, to page until it reaches one", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);

      await runSync(storedAccount());

      expect(fetchLegacyHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        ADDRESS,
        new Set(["old"]),
        new Set(),
      );
    });
  });

  describe("a mark of the generic sync", () => {
    it("is cleared, so a switch back starts clean", async () => {
      const stored = {
        ...storedAccount(),
        historyRecheck: { reason: "confirm", minHeight: 3 },
      } as unknown as NearAccount;

      const shape = await runSync(stored);

      expect(shape).toHaveProperty("historyRecheck", undefined);
    });

    it("clears the generic staking positions, so the legacy resources are the ones read", async () => {
      const stored = {
        ...storedAccount(),
        stakingPositions: [{ delegate: KNOWN_POOL, state: "active", amount: new BigNumber(1) }],
      } as unknown as NearAccount;

      const shape = await runSync(stored);

      expect(shape).toHaveProperty("stakingPositions", undefined);
    });

    it("leaves an account with no mark without the key", async () => {
      const shape = await runSync(storedAccount());

      expect(shape).not.toHaveProperty("historyRecheck");
      expect(shape).not.toHaveProperty("syncHash");
      expect(shape).not.toHaveProperty("stakingPositions");
    });

    it("clears the generic resume state, so a switch back syncs from scratch", async () => {
      const stored = { ...storedAccount(), syncHash: "0xgeneric" } as unknown as NearAccount;

      const shape = await runSync(stored);

      expect(shape).toHaveProperty("syncHash", "");
    });
  });

  describe("sync scenarios", () => {
    it("names a pool funded by a plain deposit as a candidate, listing the pools", async () => {
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue(NEW_FP);
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(
        history(["deposit"], { stakingPoolsCalled: new Map([["deposit", NEW_POOL]]) }),
      );

      await runSync(storedAccount());

      expect(stakingOptionsOfLastCall()).toMatchObject({
        listValidators: true,
        candidateValidatorIds: [NEW_POOL],
      });
    });

    it("stops knowing a pool that holds nothing any more", async () => {
      (getAccount as jest.Mock).mockResolvedValue({
        blockHeight: 1,
        balance: new BigNumber(1),
        spendableBalance: new BigNumber(1),
        nearResources: resources({ stakingPositions: [] }),
        poolListingFailed: false,
        failedCandidates: [],
      });
      const first = await runSync(storedAccount());

      await runSync({
        ...storedAccount(),
        nearResources: first.nearResources,
      } as unknown as NearAccount);

      expect(stakingOptionsOfLastCall().knownValidatorIds).toEqual([]);
    });

    it("completes the sync of a deleted account that has stored operations", async () => {
      (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);
      (getAccountStateFingerprint as jest.Mock).mockResolvedValue("||||");
      (fetchLegacyHistory as jest.Mock).mockResolvedValue(history(["old", "deleted"]));

      const shape = await runSync(storedAccount());

      expect(shape.operations?.map(op => op.hash).sort()).toEqual(["deleted", "old"]);
      expect(shape.nearResources?.accountStateFingerprint).toBe("||||");
    });
  });
});
