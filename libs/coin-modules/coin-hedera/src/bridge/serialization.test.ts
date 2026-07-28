import BigNumber from "bignumber.js";
import {
  getMockedAccount,
  getMockedAccountRaw,
  mockHederaResources,
  mockHederaResourcesRaw,
} from "../test/fixtures/account.fixture";
import type {
  HederaAccount,
  HederaAccountRaw,
  HederaResources,
  HederaResourcesRaw,
} from "../types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromHederaResourcesRaw,
  toHederaResourcesRaw,
} from "./serialization";

const mockedAccount = getMockedAccount();
const mockedAccountRaw = getMockedAccountRaw();

describe("serialization", () => {
  it("toHederaResourcesRaw should convert HederaResources to HederaResourcesRaw (null delegation)", () => {
    const result = toHederaResourcesRaw(mockHederaResources);
    expect(result).toEqual(mockHederaResourcesRaw);
  });

  it("toHederaResourcesRaw should convert HederaResources to HederaResourcesRaw (truthy delegation)", () => {
    const resources: HederaResources = {
      maxAutomaticTokenAssociations: 10,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 3,
        delegated: new BigNumber(500000),
        pendingReward: new BigNumber(1000),
      },
    };

    const result = toHederaResourcesRaw(resources);

    expect(result).toEqual({
      maxAutomaticTokenAssociations: 10,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 3,
        delegated: "500000",
        pendingReward: "1000",
      },
    });
  });

  it("fromHederaResourcesRaw should convert HederaResourcesRaw to HederaResources (null delegation)", () => {
    const result = fromHederaResourcesRaw(mockHederaResourcesRaw);
    expect(result).toEqual(mockHederaResources);
  });

  it("fromHederaResourcesRaw should convert HederaResourcesRaw to HederaResources (truthy delegation)", () => {
    const rawResources: HederaResourcesRaw = {
      maxAutomaticTokenAssociations: 5,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 7,
        delegated: "200000",
        pendingReward: "500",
      },
    };

    const result = fromHederaResourcesRaw(rawResources);

    expect(result).toEqual({
      maxAutomaticTokenAssociations: 5,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 7,
        delegated: new BigNumber(200000),
        pendingReward: new BigNumber(500),
      },
    });
  });

  it("assignToAccountRaw should assign HederaResources to AccountRaw when hederaResources exists", () => {
    assignToAccountRaw(mockedAccount, mockedAccountRaw);
    expect(typeof mockedAccountRaw.hederaResources).toBe("object");
    expect(mockedAccountRaw.hederaResources).not.toBeNull();
  });

  it("assignToAccountRaw should not set hederaResources when account has none", () => {
    const accountWithoutResources = { ...mockedAccount } as HederaAccount;
    delete (accountWithoutResources as Partial<HederaAccount>).hederaResources;
    const rawTarget = {} as HederaAccountRaw;

    assignToAccountRaw(accountWithoutResources, rawTarget);

    expect(rawTarget.hederaResources).toBeUndefined();
  });

  it("assignFromAccountRaw should assign HederaResourcesRaw to Account when hederaResources exists", () => {
    assignFromAccountRaw(mockedAccountRaw, mockedAccount);
    expect(typeof mockedAccountRaw.hederaResources).toBe("object");
    expect(mockedAccountRaw.hederaResources).not.toBeNull();
  });

  it("assignFromAccountRaw should not set hederaResources when accountRaw has none", () => {
    const rawWithoutResources = { ...mockedAccountRaw } as HederaAccountRaw;
    delete (rawWithoutResources as Partial<HederaAccountRaw>).hederaResources;
    const accountTarget = { ...mockedAccount } as HederaAccount;
    delete (accountTarget as Partial<HederaAccount>).hederaResources;

    assignFromAccountRaw(rawWithoutResources, accountTarget);

    expect(accountTarget.hederaResources).toBeUndefined();
  });
});
