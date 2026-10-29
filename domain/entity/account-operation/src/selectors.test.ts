import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import { OperationIdSchema } from "./schema";
import { selectAccountOperation, selectAccountOperations } from "./selectors";
import { mockAccountOperationsState } from "./slice.mock";

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
