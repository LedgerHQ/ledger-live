import {
  getMockedAccount,
  getMockedAccountRaw,
  mockHederaResources,
  mockHederaResourcesRaw,
} from "../test/fixtures/account";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromHederaResourcesRaw,
  toHederaResourcesRaw,
} from "./serialization";

const mockedAccount = getMockedAccount();
const mockedAccountRaw = getMockedAccountRaw();

describe("serialization", () => {
  test("toHederaResourcesRaw should convert HederaResources to HederaResourcesRaw", () => {
    const result = toHederaResourcesRaw(mockHederaResources);
    expect(result).toEqual(mockHederaResourcesRaw);
  });

  test("fromHederaResourcesRaw should convert HederaResourcesRaw to HederaResources", () => {
    const result = fromHederaResourcesRaw(mockHederaResourcesRaw);
    expect(result).toEqual(mockHederaResources);
  });

  test("assignToAccountRaw should assign HederaResources to AccountRaw", () => {
    assignToAccountRaw(mockedAccount, mockedAccountRaw);
    expect(mockedAccountRaw.hederaResources).toBeDefined();
  });

  test("assignFromAccountRaw should assign HederaResourcesRaw to Account", () => {
    assignFromAccountRaw(mockedAccountRaw, mockedAccount);
    expect(mockedAccount.hederaResources).toBeDefined();
  });
});
