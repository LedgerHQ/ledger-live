import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountShape } from "./synchronisation";
import * as network from "./network";
import type { NearAccount, NearResources } from "./types";

jest.mock("./network", () => ({
  accountStateFingerprint: jest.requireActual("./network/node").accountStateFingerprint,
  fetchAccountDetails: jest.fn(),
  fetchAccountKeyNonce: jest.fn(),
  getAccount: jest.fn(),
  getOperations: jest.fn(),
}));
jest.mock("./config", () => ({ getCoinConfig: () => ({}) }));

const mocked = network as jest.Mocked<typeof network>;
const ADDRESS = "a".repeat(64);
const POOL = "known.poolv1.near";
const NEW_POOL = "new.poolv1.near";
const details = (amount: string) => ({
  amount,
  storage_usage: 100,
  block_height: 1,
  locked: "0",
  code_hash: "1",
});

const resources = (fingerprint?: string, pools: string[] = [POOL]): NearResources => ({
  stakedBalance: new BigNumber(0),
  availableBalance: new BigNumber(0),
  pendingBalance: new BigNumber(0),
  storageUsageBalance: new BigNumber(0),
  stakingPositions: pools.map(validatorId => ({
    validatorId,
    staked: new BigNumber(1),
    available: new BigNumber(0),
    pending: new BigNumber(0),
  })),
  ...(fingerprint !== undefined && { accountStateFingerprint: fingerprint }),
});

const op = (hash: string, extra: Record<string, unknown> = {}): Operation =>
  ({
    id: hash,
    hash,
    type: "OUT",
    extra,
    recipients: [],
    senders: [],
    blockHeight: 1,
    date: new Date(),
    value: new BigNumber(0),
    fee: new BigNumber(0),
    accountId: "x",
  }) as unknown as Operation;

const fingerprintOf = (amount: string) => network.accountStateFingerprint(details(amount), "5");

const sync = (initialAccount?: Partial<NearAccount>) =>
  getAccountShape(
    {
      address: ADDRESS,
      currency: { id: "near" },
      derivationMode: "nearbip44h",
      initialAccount,
    } as never,
    {} as never,
  );

beforeEach(() => {
  jest.resetAllMocks();
  mocked.fetchAccountKeyNonce.mockResolvedValue("5");
  mocked.getAccount.mockImplementation(async (_c, _a, options) => ({
    blockHeight: 1,
    balance: new BigNumber(1),
    spendableBalance: new BigNumber(1),
    nearResources: resources(undefined, options?.knownValidatorIds ?? [POOL]),
  }));
});

describe("legacy sync driven by the account state", () => {
  it("reads neither history nor the pool listing when the state is unchanged", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("10"));

    const shape = await sync({
      operations: [op("h1")],
      nearResources: resources(fingerprintOf("10")),
    });

    expect(mocked.getOperations).not.toHaveBeenCalled();
    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: false, knownValidatorIds: [POOL] }),
    );
    expect(shape.operations).toHaveLength(1);
  });

  it("reads history when the state changed, without listing pools for a non-staking operation", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockResolvedValue([op("h2"), op("h1")]);

    const shape = await sync({
      operations: [op("h1")],
      nearResources: resources(fingerprintOf("10")),
    });

    expect(mocked.getOperations).toHaveBeenCalledTimes(1);
    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: false }),
    );
    expect(shape.operations.map(o => o.hash)).toEqual(["h2", "h1"]);
    expect(shape.nearResources?.accountStateFingerprint).toBe(fingerprintOf("11"));
  });

  it("lists pools when a new operation calls a pool it does not know", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockResolvedValue([op("h2", { stakingPool: NEW_POOL }), op("h1")]);

    await sync({ operations: [op("h1")], nearResources: resources(fingerprintOf("10")) });

    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: true }),
    );
  });

  it("does not list pools for a staking call to a pool it already knows", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockResolvedValue([op("h2", { stakingPool: POOL }), op("h1")]);

    await sync({ operations: [op("h1")], nearResources: resources(fingerprintOf("10")) });

    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: false }),
    );
  });

  it("lists pools when a full page of unseen operations may hide older ones", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockResolvedValue(Array.from({ length: 25 }, (_, i) => op(`n${i}`)));

    await sync({ operations: [op("h1")], nearResources: resources(fingerprintOf("10")) });

    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: true }),
    );
  });

  it("keeps the stored operations and the previous state when history fails", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockRejectedValue(new Error("429"));

    const shape = await sync({
      operations: [op("h1")],
      nearResources: resources(fingerprintOf("10")),
    });

    expect(shape.operations.map(o => o.hash)).toEqual(["h1"]);
    expect(shape.nearResources?.accountStateFingerprint).toBe(fingerprintOf("10"));
    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: true, knownValidatorIds: [POOL] }),
    );
  });

  it("fails a first sync when history fails", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockRejectedValue(new Error("429"));

    await expect(sync(undefined)).rejects.toThrow("429");
  });

  it("reads history once more when the state changed but nothing new came back, then accepts it", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("11"));
    mocked.getOperations.mockResolvedValue([op("h1")]);

    const first = await sync({
      operations: [op("h1")],
      nearResources: resources(fingerprintOf("10")),
    });
    expect(first.nearResources?.accountStateFingerprint).toBe(fingerprintOf("10"));
    expect(first.nearResources?.historyRecheckPending).toBe(true);

    const second = await sync({
      operations: [op("h1")],
      nearResources: first.nearResources as NearResources,
    });
    expect(mocked.getOperations).toHaveBeenCalledTimes(2);
    expect(second.nearResources?.accountStateFingerprint).toBe(fingerprintOf("11"));
    expect(second.nearResources?.historyRecheckPending).toBeUndefined();
  });

  it("reads history while an operation is pending even if the state is unchanged", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("10"));
    mocked.getOperations.mockResolvedValue([op("h1")]);

    await sync({
      operations: [op("h1")],
      pendingOperations: [op("p1")],
      nearResources: resources(fingerprintOf("10")),
    });

    expect(mocked.getOperations).toHaveBeenCalledTimes(1);
  });

  it("lists pools once for an account synced before the state marker existed", async () => {
    mocked.fetchAccountDetails.mockResolvedValue(details("10"));
    mocked.getOperations.mockResolvedValue([op("h1")]);

    await sync({ operations: [op("h1")], nearResources: resources(undefined) });

    expect(mocked.getOperations).toHaveBeenCalledTimes(1);
    expect(mocked.getAccount).toHaveBeenCalledWith(
      {},
      ADDRESS,
      expect.objectContaining({ discover: true }),
    );
  });
});
