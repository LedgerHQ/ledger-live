import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import {
  getMockedAccount,
  getMockedAccountRaw,
  mockHederaResources,
  mockHederaResourcesRaw,
} from "../test/fixtures/account.fixture";
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
    expect(typeof mockedAccountRaw.hederaResources).toBe("object");
    expect(mockedAccountRaw.hederaResources).not.toBeNull();
  });

  test("assignFromAccountRaw should assign HederaResourcesRaw to Account", () => {
    assignFromAccountRaw(mockedAccountRaw, mockedAccount);
    expect(typeof mockedAccountRaw.hederaResources).toBe("object");
    expect(mockedAccountRaw.hederaResources).not.toBeNull();
  });

  describe("assignFromAccountRaw – subOperations inferred at deserialization", () => {
    const tokenSubOperation = { id: "token-op", type: "OUT", hash: "h1" } as Operation;
    const makeOperation = (type: OperationType): Operation =>
      ({ id: `op-${type}`, type, hash: "h1", subOperations: [tokenSubOperation] }) as Operation;

    const deserialize = (operations: Operation[]): Account => {
      const account = { ...getMockedAccount(), operations };
      assignFromAccountRaw(getMockedAccountRaw(), account);
      return account;
    };

    test("strips subOperations from value coin operations of a multi-asset tx", () => {
      const account = deserialize([
        makeOperation("OUT"),
        makeOperation("IN"),
        makeOperation("REWARD"),
      ]);

      for (const operation of account.operations) {
        expect(operation.subOperations).toEqual([]);
      }
    });

    test("keeps subOperations on FEES and NONE parent operations", () => {
      const account = deserialize([makeOperation("FEES"), makeOperation("NONE")]);

      for (const operation of account.operations) {
        expect(operation.subOperations).toEqual([tokenSubOperation]);
      }
    });
  });
});
