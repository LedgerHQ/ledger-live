import {
  getMockedAccount,
  getMockedAccountRaw,
  mockAleoResources,
  mockAleoResourcesRaw,
} from "../__tests__/fixtures/account.fixture";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  toAleoResourcesRaw,
  fromAleoResourcesRaw,
} from "./serialization";

const mockedAccount = getMockedAccount();
const mockedAccountRaw = getMockedAccountRaw();

describe("serialization", () => {
  test("toAleoResourcesRaw should convert AleoResources to AleoResourcesRaw", () => {
    const result = toAleoResourcesRaw(mockAleoResources);

    expect(result).toEqual(mockAleoResourcesRaw);
  });

  test("fromAleoResourcesRaw should convert AleoResourcesRaw to AleoResources", () => {
    const result = fromAleoResourcesRaw(mockAleoResourcesRaw);

    expect(result).toEqual(mockAleoResources);
  });

  test("assignToAccountRaw should assign AleoResources to AccountRaw", () => {
    assignToAccountRaw(mockedAccount, mockedAccountRaw);

    expect(typeof mockedAccountRaw.aleoResources).toBe("object");
    expect(mockedAccountRaw.aleoResources).not.toBeNull();
  });

  test("assignFromAccountRaw should assign AleoResourcesRaw to Account", () => {
    assignFromAccountRaw(mockedAccountRaw, mockedAccount);

    expect(typeof mockedAccountRaw.aleoResources).toBe("object");
    expect(mockedAccountRaw.aleoResources).not.toBeNull();
  });
});
