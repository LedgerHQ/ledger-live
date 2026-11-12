import BigNumber from "bignumber.js";
import type { Account, AccountRaw, Operation } from "@ledgerhq/types-live";
import {
  assignStakingResourcesFromAccountRaw,
  assignStakingResourcesToAccountRaw,
  fromOperationRaw,
  toOperationRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import accountRawAssignModule, { getAccountRawAssignHooks } from "../accountRawAssign";

const loadAccountRawAssignForFamilyMock = jest.fn();

jest.mock("../../../coin-modules/registry", () => ({
  loadAccountRawAssignForFamily: (...args: unknown[]) => loadAccountRawAssignForFamilyMock(...args),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/serialization", () => {
  return {
    ...jest.requireActual("@ledgerhq/ledger-wallet-framework/serialization"),
    assignStakingResourcesFromAccountRaw: jest.fn(),
    assignStakingResourcesToAccountRaw: jest.fn(),
  };
});

describe("getAccountRawAssignHooks — operation extra serialization", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps the framework-owned keys a family hook does not map", async () => {
    // The serialization layer replaces `extra` wholesale, so without the framework's own half a
    // family mapping only `frozenAmount` would lose `ledgerOpType` and `memo` on every restore.
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      fromOperationExtraRaw: (extraRaw: any) => ({
        frozenAmount: new BigNumber(extraRaw.frozenAmount),
      }),
    });

    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const revived = fromOperationExtraRaw!({
      ledgerOpType: "FREEZE",
      memo: "hello",
      frozenAmount: "1000000",
    }) as any;

    expect(revived.ledgerOpType).toBe("FREEZE");
    expect(revived.memo).toBe("hello");
    expect(revived.frozenAmount).toEqual(new BigNumber(1_000_000));
  });

  it("serializes the framework's own stake amount and revives it", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      fromOperationExtraRaw: () => ({}),
      toOperationExtraRaw: () => ({}),
    });

    const { fromOperationExtraRaw, toOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    const raw = toOperationExtraRaw!({
      stake: { address: "validator", amount: new BigNumber(2_500) },
    }) as any;
    expect(raw.stake).toEqual({ address: "validator", amount: "2500" });

    const revived = fromOperationExtraRaw!(raw) as any;
    expect(revived.stake.amount).toEqual(new BigNumber(2_500));
  });

  it("lets the family's own mapping win over the framework passthrough", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({ frozenAmount: extra.frozenAmount.toFixed() }),
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({ frozenAmount: new BigNumber(42), memo: "kept" }) as any;

    expect(raw.frozenAmount).toBe("42");
    expect(raw.memo).toBe("kept");
  });

  it("keeps the framework half when a family hook returns nothing usable", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: () => undefined,
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({
      ledgerOpType: "FREEZE",
      stake: { address: "validator", amount: new BigNumber(7) },
    }) as any;

    expect(raw.ledgerOpType).toBe("FREEZE");
    expect(raw.stake).toEqual({ address: "validator", amount: "7" });
  });

  it("converts the framework's stake even when the family hook spreads the whole bag", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({
        ...extra,
        frozenAmount: extra.frozenAmount.toFixed(),
      }),
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({
      frozenAmount: new BigNumber(42),
      stake: { address: "validator", amount: new BigNumber(2_500) },
    }) as any;

    expect(raw.frozenAmount).toBe("42");
    expect(raw.stake).toEqual({ address: "validator", amount: "2500" });
  });

  it("converts both directions when the family declares only one", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => extra,
    });

    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    expect(fromOperationExtraRaw).toBeDefined();
    const revived = fromOperationExtraRaw!({
      stake: { address: "validator", amount: "2500" },
    }) as any;
    expect(revived.stake.amount).toEqual(new BigNumber(2_500));
  });

  it("declares no hook when the family declares none", async () => {
    // `toOperationRaw` gates on the hook being present and persists `extra` verbatim otherwise, so
    // wrapping unconditionally would change how every already-migrated family serializes.
    loadAccountRawAssignForFamilyMock.mockResolvedValue({ assignFromAccountRaw: jest.fn() });

    const hooks = await getAccountRawAssignHooks("evm");

    expect(hooks.fromOperationExtraRaw).toBeUndefined();
    expect(hooks.toOperationExtraRaw).toBeUndefined();
  });
});

describe("getAccountRawAssignHooks — round trip through the serialization layer", () => {
  beforeEach(() => jest.clearAllMocks());

  function baseOperation(extra: Record<string, unknown>): Operation {
    return {
      id: "accId_hash_OUT",
      hash: "hash",
      type: "OUT",
      senders: ["s"],
      recipients: ["r"],
      accountId: "accId",
      blockHash: "bh",
      blockHeight: 1,
      date: new Date("2026-01-01"),
      value: new BigNumber(1),
      fee: new BigNumber(1),
      extra,
    } as Operation;
  }

  it("keeps framework keys and converts stake.amount while a family maps only its own key", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({ frozenAmount: extra.frozenAmount.toFixed() }),
      fromOperationExtraRaw: (raw: any) => ({ frozenAmount: new BigNumber(raw.frozenAmount) }),
    });
    const { toOperationExtraRaw, fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    const op = baseOperation({
      ledgerOpType: "FREEZE",
      memo: "hi",
      frozenAmount: new BigNumber(1000),
      stake: { address: "v", amount: new BigNumber(2500) },
    });

    const raw = toOperationRaw(op, undefined, toOperationExtraRaw) as any;
    expect(raw.extra.ledgerOpType).toBe("FREEZE");
    expect(raw.extra.memo).toBe("hi");
    expect(raw.extra.frozenAmount).toBe("1000");
    expect(raw.extra.stake).toEqual({ address: "v", amount: "2500" });

    const persisted = JSON.parse(JSON.stringify(raw));
    expect(persisted.extra.stake.amount).toBe("2500");

    const revived = fromOperationRaw(persisted, "accId", null, fromOperationExtraRaw) as any;
    expect(revived.extra.ledgerOpType).toBe("FREEZE");
    expect(revived.extra.memo).toBe("hi");
    expect(revived.extra.frozenAmount).toEqual(new BigNumber(1000));
    expect(revived.extra.stake.amount).toEqual(new BigNumber(2500));
  });

  it("revives an unconverted stake.amount as a string, not a BigNumber, without the framework hook", () => {
    const op = baseOperation({ stake: { address: "v", amount: new BigNumber(2500) } });
    const raw = toOperationRaw(op, undefined, undefined);
    const persisted = JSON.parse(JSON.stringify(raw));

    expect(persisted.extra.stake.amount).toBe("2500");
    expect(JSON.stringify(new BigNumber(2500))).toBe('"2500"');

    const revived = fromOperationRaw(persisted, "accId", null, undefined) as any;
    expect(typeof revived.extra.stake.amount).toBe("string");
    expect(BigNumber.isBigNumber(revived.extra.stake.amount)).toBe(false);
  });
});

describe("assignToAccountRaw", () => {
  const { assignToAccountRaw } = accountRawAssignModule;
  const mockAssignStakingResourcesToAccountRaw = jest.mocked(assignStakingResourcesToAccountRaw);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should correcly call staking resource serialization", () => {
    const account = {} as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    expect(mockAssignStakingResourcesToAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockAssignStakingResourcesToAccountRaw).toHaveBeenCalledWith(account, accountRaw);
  });
});

describe("assignFromAccountRaw", () => {
  const { assignFromAccountRaw } = accountRawAssignModule;
  const mockAssignStakingResourcesFromAccountRaw = jest.mocked(
    assignStakingResourcesFromAccountRaw,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should correcly call staking resource serialization", () => {
    const account = {} as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignFromAccountRaw(accountRaw, account);

    expect(mockAssignStakingResourcesFromAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockAssignStakingResourcesFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);
  });
});

describe("cosmos account raw round trip", () => {
  const cosmosHooks = jest.requireActual("../../../families/cosmos/accountRawAssign").default;
  const actualSerialization = jest.requireActual("@ledgerhq/ledger-wallet-framework/serialization");

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(assignStakingResourcesToAccountRaw)
      .mockImplementation(actualSerialization.assignStakingResourcesToAccountRaw);
    jest
      .mocked(assignStakingResourcesFromAccountRaw)
      .mockImplementation(actualSerialization.assignStakingResourcesFromAccountRaw);
  });

  const completionDate = new Date("2026-03-01T12:00:00.000Z");

  it("keeps staking resources, sequence and xpub through a JSON round trip", () => {
    const account = {
      freshAddress: "cosmos1abc",
      xpub: "03publickey",
      sequence: 42,
      stakingResources: {
        delegations: [
          {
            validatorAddress: "cosmosvaloper1a",
            amount: new BigNumber(1_000),
            pendingRewards: new BigNumber(5),
            status: "bonded",
          },
        ],
        redelegations: [
          {
            validatorSrcAddress: "cosmosvaloper1a",
            validatorDstAddress: "cosmosvaloper1b",
            amount: new BigNumber(300),
            completionDate,
          },
        ],
        unbondings: [
          { validatorAddress: "cosmosvaloper1a", amount: new BigNumber(200), completionDate },
        ],
        delegatedBalance: new BigNumber(1_000),
        pendingRewardsBalance: new BigNumber(5),
        unbondingBalance: new BigNumber(200),
      },
    } as unknown as Account;

    const accountRaw = { xpub: account.xpub } as AccountRaw;
    cosmosHooks.assignToAccountRaw(account, accountRaw);
    const persisted = JSON.parse(JSON.stringify(accountRaw));

    expect(persisted.sequence).toBe(42);
    expect(persisted.xpub).toBe("03publickey");
    expect(persisted.stakingResources.delegations[0].amount).toBe("1000");
    expect(persisted.stakingResources.unbondings[0].completionDate).toBe(
      "2026-03-01T12:00:00.000Z",
    );

    const revived = { freshAddress: "cosmos1abc", xpub: persisted.xpub } as any;
    cosmosHooks.assignFromAccountRaw(persisted, revived);

    expect(revived.sequence).toBe(42);
    expect(revived.xpub).toBe("03publickey");
    expect(revived.stakingResources.delegations[0].amount).toEqual(new BigNumber(1_000));
    expect(revived.stakingResources.delegations[0].pendingRewards).toEqual(new BigNumber(5));
    expect(revived.stakingResources.redelegations[0].amount).toEqual(new BigNumber(300));
    expect(revived.stakingResources.redelegations[0].completionDate).toEqual(completionDate);
    expect(revived.stakingResources.unbondings[0].completionDate).toEqual(completionDate);
    expect(revived.stakingResources.delegatedBalance).toEqual(new BigNumber(1_000));
    expect(revived.stakingResources.unbondingBalance).toEqual(new BigNumber(200));
  });

  it("migrates a legacy cosmosResources account to stakingResources and xpub", () => {
    const legacyRaw = {
      cosmosResources: {
        delegations: [
          {
            validatorAddress: "cosmosvaloper1a",
            amount: "1000",
            pendingRewards: "5",
            status: "bonded",
          },
        ],
        redelegations: [],
        unbondings: [
          {
            validatorAddress: "cosmosvaloper1a",
            amount: "200",
            completionDate: "2026-03-01T12:00:00.000Z",
          },
        ],
        delegatedBalance: "1000",
        pendingRewardsBalance: "5",
        unbondingBalance: "200",
        sequence: 7,
        publicKey: "03legacykey",
      },
    } as unknown as AccountRaw;
    const account = { freshAddress: "cosmos1abc", xpub: "cosmos1abc" } as any;

    cosmosHooks.assignFromAccountRaw(legacyRaw, account);

    expect(account.sequence).toBe(7);
    expect(account.xpub).toBe("03legacykey");
    expect(account.stakingResources.delegations[0].amount).toEqual(new BigNumber(1_000));
    expect(account.stakingResources.unbondings[0].completionDate).toEqual(completionDate);
    expect(account.stakingResources.unbondingBalance).toEqual(new BigNumber(200));
  });

  describe("operation extra", () => {
    it("round-trips a delegation's validators as BigNumber and string", () => {
      const raw = cosmosHooks.toOperationExtraRaw({
        validators: [
          { address: "cosmosvaloper1a", amount: new BigNumber(10) },
          { address: "cosmosvaloper1b", amount: new BigNumber(20) },
        ],
      });

      expect(raw).toEqual({
        validators: [
          { address: "cosmosvaloper1a", amount: "10" },
          { address: "cosmosvaloper1b", amount: "20" },
        ],
      });
      expect(cosmosHooks.fromOperationExtraRaw(JSON.parse(JSON.stringify(raw)))).toEqual({
        validators: [
          { address: "cosmosvaloper1a", amount: new BigNumber(10) },
          { address: "cosmosvaloper1b", amount: new BigNumber(20) },
        ],
      });
    });

    it("round-trips a single validator, the redelegation source and the memo", () => {
      const extra = {
        validator: { address: "cosmosvaloper1b", amount: new BigNumber(300) },
        sourceValidator: "cosmosvaloper1a",
        memo: "thanks",
      };

      const raw = cosmosHooks.toOperationExtraRaw(extra);

      expect(raw).toEqual({
        validator: { address: "cosmosvaloper1b", amount: "300" },
        sourceValidator: "cosmosvaloper1a",
        memo: "thanks",
      });
      expect(cosmosHooks.fromOperationExtraRaw(raw)).toEqual(extra);
    });

    it("round-trips the auto-claimed rewards of a delegation", () => {
      const extra = { autoClaimedRewards: "12" };

      expect(cosmosHooks.toOperationExtraRaw(extra)).toEqual({ autoClaimedRewards: "12" });
      expect(cosmosHooks.fromOperationExtraRaw({ autoClaimedRewards: "12" })).toEqual(extra);
    });

    it("drops empty validators and returns an empty extra for a non-cosmos bag", () => {
      expect(cosmosHooks.toOperationExtraRaw({ validators: [], memo: "m" })).toEqual({ memo: "m" });
      expect(cosmosHooks.toOperationExtraRaw({ ledgerOpType: "FREEZE" })).toEqual({});
      expect(cosmosHooks.fromOperationExtraRaw({ ledgerOpType: "FREEZE" })).toEqual({});
    });
  });
});
