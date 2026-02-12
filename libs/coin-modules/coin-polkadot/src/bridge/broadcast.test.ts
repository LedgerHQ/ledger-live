import { Operation } from "@ledgerhq/types-live";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import { broadcast } from "./broadcast";

const mockSubmitExtrinsic = jest.fn();

jest.mock("../network", () => {
  return {
    submitExtrinsic: (arg: any) => mockSubmitExtrinsic(arg),
  };
});

const logicBroadcastMock = jest.fn();
jest.mock("../logic", () => {
  return {
    broadcast: (signature: string, currencyId?: string) =>
      logicBroadcastMock(signature, currencyId),
  };
});

const patchOperationWithHashMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/operation", () => {
  return {
    patchOperationWithHash: (operation: Operation, hash: string) =>
      patchOperationWithHashMock(operation, hash),
  };
});

const account = createFixtureAccount();

describe("broadcast", () => {
  it("it should broadcast the signed operation and return an operation with the hash", async () => {
    const hash = "some random hash";
    logicBroadcastMock.mockReturnValueOnce(hash);

    const patchedOperation = createFixtureOperation();
    patchOperationWithHashMock.mockReturnValueOnce(patchedOperation);

    const signature = "some random signature";
    const operation = createFixtureOperation();

    const broadcastedOperation = await broadcast({
      account: account,
      signedOperation: {
        signature,
        operation,
      },
    });

    expect(logicBroadcastMock).toHaveBeenCalledTimes(1);
    expect(logicBroadcastMock.mock.lastCall[0]).toEqual(signature);
    expect(logicBroadcastMock.mock.lastCall[1]).toEqual(account.currency.id);

    expect(patchOperationWithHashMock).toHaveBeenCalledTimes(1);
    expect(patchOperationWithHashMock.mock.lastCall[0]).toEqual(operation);
    expect(patchOperationWithHashMock.mock.lastCall[1]).toEqual(hash);

    expect(broadcastedOperation).toEqual(patchedOperation);
  });
});
