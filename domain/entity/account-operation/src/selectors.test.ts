import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import { OperationIdSchema } from "./schema";
import { selectAccountOperation, selectAccountOperations } from "./selectors";
import { mockAccountOperationsEntry, mockAccountOperationsState } from "./slice.mock";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const eth = mockAccountOperation({ id: "op-1", assetId: "ethereum" });
const usdt = mockAccountOperation({
  id: "op-1-usdt",
  assetId: "ethereum/erc20/usd-tether",
  parentId: "op-1",
});
const state = {
  accountOperations: mockAccountOperationsState({ [accountUUID]: [eth, usdt] }),
};

describe("account operations selectors", () => {
  it("should return the loaded window of an account", () => {
    expect(selectAccountOperations(state, accountUUID)).toEqual([eth, usdt]);
  });

  it("should return undefined for an account never read", () => {
    expect(
      selectAccountOperations(
        { accountOperations: mockAccountOperationsState() },
        otherAccountUUID,
      ),
    ).toBeUndefined();
  });

  it("should return the window of the query asked, without filtering it", () => {
    const usdtQuery = { filterAsset: usdt.assetId };
    const filtered = {
      accountOperations: {
        [accountUUID]: {
          byId: { [eth.id]: eth, [usdt.id]: usdt },
          windows: {
            ...mockAccountOperationsEntry([eth, usdt]).windows,
            ...mockAccountOperationsEntry([eth], usdtQuery).windows,
          },
        },
      },
    };
    expect(selectAccountOperations(filtered, accountUUID, usdtQuery)).toEqual([eth]);
    expect(selectAccountOperations(filtered, accountUUID, { limit: 1 })).toBeUndefined();
  });

  it("should return the same list while the window and its rows are unchanged", () => {
    expect(selectAccountOperations(state, accountUUID, {})).toBe(
      selectAccountOperations({ ...state }, accountUUID, {}),
    );
  });

  it("should return one operation by id", () => {
    expect(
      selectAccountOperation(state, accountUUID, OperationIdSchema.parse("op-1-usdt")),
    ).toEqual(usdt);
  });

  it("should return undefined for an unknown operation id", () => {
    expect(
      selectAccountOperation(state, accountUUID, OperationIdSchema.parse("nope")),
    ).toBeUndefined();
  });
});
