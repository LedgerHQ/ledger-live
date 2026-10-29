import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import { OperationIdSchema } from "./schema";
import { selectAccountOperation, selectAccountOperations } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const eth = mockAccountOperation({ id: "op-1", assetId: "ethereum" });
const usdt = mockAccountOperation({
  id: "op-1-usdt",
  assetId: "ethereum/erc20/usd-tether",
  parentId: "op-1",
});
const state = { accountOperations: { [accountUUID]: [eth, usdt] } };

describe("account operations selectors", () => {
  it("should return the loaded window of an account", () => {
    expect(selectAccountOperations(state, accountUUID)).toEqual([eth, usdt]);
  });

  it("should return undefined for an account never read", () => {
    expect(selectAccountOperations({ accountOperations: {} }, accountUUID)).toBeUndefined();
  });

  it("should return only the rows of the filtered asset", () => {
    expect(selectAccountOperations(state, accountUUID, { filterAsset: usdt.assetId })).toEqual([
      usdt,
    ]);
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
