import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { setCoinConfig, type NearConfig } from "./config";
import {
  fetchAccountDetails,
  fetchLegacyHistory,
  getAccount,
  getAccountStateFingerprint,
} from "./network";
import { getAccountShape } from "./synchronisation";
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
  extra: { stakingPoolsCalled?: Map<string, string>; isFullPage?: boolean } = {},
) => ({
  operations: hashes.map(operation),
  stakingPoolsCalled: extra.stakingPoolsCalled ?? new Map<string, string>(),
  isFullPage: extra.isFullPage ?? false,
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

  it("keeps the confirmation marker when the confirmation read fails", async () => {
    (fetchLegacyHistory as jest.Mock).mockRejectedValue(new Error("429"));

    const shape = await runSync(storedAccount({ resources: { historyConfirmPending: true } }));

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(shape.nearResources?.historyConfirmPending).toBe(true);
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

  it("reads the history and lists the pools once for an account stored without a fingerprint", async () => {
    const legacy = storedAccount();
    delete legacy.nearResources.accountStateFingerprint;

    const shape = await runSync(legacy);

    expect(fetchLegacyHistory).toHaveBeenCalledTimes(1);
    expect(stakingOptionsOfLastCall().listValidators).toBe(true);
    expect(shape.nearResources?.accountStateFingerprint).toBe(STORED_FP);
    expect(shape.nearResources).not.toHaveProperty("historyRecheckSince");
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
});
