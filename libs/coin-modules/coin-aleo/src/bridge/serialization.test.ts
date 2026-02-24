import {
  getMockedAccount,
  getMockedAccountRaw,
  mockAleoResources,
  mockAleoResourcesRaw,
} from "../__tests__/fixtures/account.fixture";
import type { AleoAccount, AleoAccountRaw } from "../types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  toAleoResourcesRaw,
  fromAleoResourcesRaw,
} from "./serialization";

describe("serialization", () => {
  let mockedAccount: AleoAccount;
  let mockedAccountRaw: AleoAccountRaw;

  beforeEach(() => {
    mockedAccount = getMockedAccount();
    mockedAccountRaw = getMockedAccountRaw();
  });

  it("should serialize AleoResources to raw format", () => {
    const result = toAleoResourcesRaw(mockAleoResources);

    expect(result).toEqual(mockAleoResourcesRaw);
  });

  it("should deserialize raw format back to AleoResources", () => {
    const result = fromAleoResourcesRaw(mockAleoResourcesRaw);

    expect(result).toEqual(mockAleoResources);
  });

  it("should write serialized resources onto AccountRaw", () => {
    assignToAccountRaw(mockedAccount, mockedAccountRaw);

    expect(mockedAccountRaw.aleoResources).toEqual(mockAleoResourcesRaw);
  });

  it("should read and deserialize resources from AccountRaw onto Account", () => {
    assignFromAccountRaw(mockedAccountRaw, mockedAccount);

    expect(mockedAccount.aleoResources).toEqual(mockAleoResources);
  });
});
