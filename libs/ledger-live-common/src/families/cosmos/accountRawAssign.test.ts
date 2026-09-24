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

  it("should correctly map generic account", () => {
    const account = { stakingResources: {} } as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    expect(mockedGenericAssignToAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedGenericAssignToAccountRaw).toHaveBeenCalledWith(account, accountRaw);

    expect(mockedCosmosAssignToAccountRaw).not.toHaveBeenCalled();
  });

  it("should correctly map legacy cosmos account", () => {
    const account = { cosmosResources: {} } as unknown as Account;
    const accountRaw = {} as unknown as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    expect(mockedCosmosAssignToAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedCosmosAssignToAccountRaw).toHaveBeenCalledWith(account, accountRaw);

    expect(mockedGenericAssignToAccountRaw).not.toHaveBeenCalled();
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

  it("should correctly map generic raw account", () => {
    const account = {} as unknown as Account;
    const accountRaw = { stakingResources: {} } as unknown as AccountRaw;
    assignFromAccountRaw(accountRaw, account);

    expect(mockedGenericAssignFromAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedGenericAssignFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);

    expect(mockedCosmosAssignFromAccountRaw).not.toHaveBeenCalled();
  });

  it("should correctly map legacy cosmos raw account", () => {
    const account = {} as unknown as Account;
    const accountRaw = { cosmosResources: {} } as unknown as AccountRaw;
    assignFromAccountRaw(accountRaw, account);

    expect(mockedCosmosAssignFromAccountRaw).toHaveBeenCalledTimes(1);
    expect(mockedCosmosAssignFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);

    expect(mockedGenericAssignFromAccountRaw).not.toHaveBeenCalled();
  });
});
