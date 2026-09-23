import {
  assignFromAccountRaw as cosmosAssignFromAccountRaw,
  assignToAccountRaw as cosmosAssignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-cosmos/serialization";
import genericAccountRawAssign from "@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import accountRawAssignModule from "./accountRawAssign";

const { assignFromAccountRaw, assignToAccountRaw } = accountRawAssignModule;

jest.mock("@ledgerhq/coin-cosmos/serialization", () => {
  return {
    ...jest.requireActual("@ledgerhq/coin-cosmos/serialization"),
    assignToAccountRaw: jest.fn(),
    assignFromAccountRaw: jest.fn(),
  };
});

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign"),
    assignToAccountRaw: jest.fn(),
    assignFromAccountRaw: jest.fn(),
  };
});

describe("assignToAccountRaw", () => {
  const mockedGenericAssignToAccountRaw = jest.mocked(genericAccountRawAssign.assignToAccountRaw);
  const mockedCosmosAssignToAccountRaw = jest.mocked(cosmosAssignToAccountRaw);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps both the legacy cosmos shape and the generic staking shape", () => {
    const account = { cosmosResources: {}, stakingResources: {} } as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    expect(mockedCosmosAssignToAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedCosmosAssignToAccountRaw).toHaveBeenCalledWith(account, accountRaw);

    expect(mockedGenericAssignToAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedGenericAssignToAccountRaw).toHaveBeenCalledWith(account, accountRaw);
  });

  it("preserves sequence/publicKey when the generic step overwrites stakingResources", () => {
    mockedCosmosAssignToAccountRaw.mockImplementation((_acc, raw) => {
      (raw as unknown as { stakingResources: unknown }).stakingResources = {
        delegations: [],
        sequence: 42,
        publicKey: "0xpub",
      };
    });
    mockedGenericAssignToAccountRaw.mockImplementation((_acc, raw) => {
      (raw as unknown as { stakingResources: unknown }).stakingResources = { delegations: [] };
    });

    const account = { cosmosResources: {}, stakingResources: {} } as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    expect(
      (accountRaw as unknown as { stakingResources: { sequence: number; publicKey: string } })
        .stakingResources,
    ).toEqual({ delegations: [], sequence: 42, publicKey: "0xpub" });
  });
});

describe("assignFromAccountRaw", () => {
  const mockedGenericAssignFromAccountRaw = jest.mocked(
    genericAccountRawAssign.assignFromAccountRaw,
  );
  const mockedCosmosAssignFromAccountRaw = jest.mocked(cosmosAssignFromAccountRaw);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps both the legacy cosmos shape and the generic staking shape", () => {
    const account = {} as unknown as Account;
    const accountRaw = { cosmosResources: {}, stakingResources: {} } as unknown as AccountRaw;
    assignFromAccountRaw(accountRaw, account);

    expect(mockedCosmosAssignFromAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedCosmosAssignFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);

    expect(mockedGenericAssignFromAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedGenericAssignFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);
  });

  it("revives stakingResources from cosmosResources when the persisted raw predates the migration", () => {
    const cosmosResources = { delegations: [], redelegations: [], unbondings: [] };
    mockedCosmosAssignFromAccountRaw.mockImplementation((_raw, acc) => {
      (acc as unknown as { cosmosResources: unknown }).cosmosResources = cosmosResources;
    });
    mockedGenericAssignFromAccountRaw.mockImplementation(() => {});

    const account = {} as unknown as Account;
    const accountRaw = { cosmosResources } as unknown as AccountRaw;

    assignFromAccountRaw(accountRaw, account);

    expect((account as unknown as { stakingResources: unknown }).stakingResources).toBe(
      cosmosResources,
    );
  });

  it("does not override stakingResources when the raw already has the generic shape", () => {
    const stakingResources = { delegations: [] };
    mockedCosmosAssignFromAccountRaw.mockImplementation((_raw, acc) => {
      (acc as unknown as { cosmosResources: unknown }).cosmosResources = {
        delegations: ["legacy value that must not win"],
      };
    });
    mockedGenericAssignFromAccountRaw.mockImplementation((_raw, acc) => {
      (acc as unknown as { stakingResources: unknown }).stakingResources = stakingResources;
    });

    const account = {} as unknown as Account;
    const accountRaw = { stakingResources } as unknown as AccountRaw;

    assignFromAccountRaw(accountRaw, account);

    expect((account as unknown as { stakingResources: unknown }).stakingResources).toBe(
      stakingResources,
    );
  });

  it("preserves sequence/publicKey when the generic step overwrites stakingResources", () => {
    mockedCosmosAssignFromAccountRaw.mockImplementation((_raw, acc) => {
      (acc as unknown as { stakingResources: unknown }).stakingResources = {
        delegations: [],
        sequence: 42,
        publicKey: "0xpub",
      };
    });
    mockedGenericAssignFromAccountRaw.mockImplementation((_raw, acc) => {
      (acc as unknown as { stakingResources: unknown }).stakingResources = { delegations: [] };
    });

    const account = {} as unknown as Account;
    const accountRaw = { stakingResources: {} } as unknown as AccountRaw;

    assignFromAccountRaw(accountRaw, account);

    expect(
      (account as unknown as { stakingResources: { sequence: number; publicKey: string } })
        .stakingResources,
    ).toEqual({ delegations: [], sequence: 42, publicKey: "0xpub" });
  });
});
