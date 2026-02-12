import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { broadcastTransaction as broadcastLogic } from "../api";
import broadcast from "./broadcast";

jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../api");

describe("broadcast", () => {
  let patchOperationSpy: jest.SpyInstance;
  let broadcastSpy: jest.SpyInstance;
  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastSpy = jest.spyOn({ broadcastLogic }, "broadcastLogic");
    broadcastSpy.mockResolvedValue("hash");
  });

  const signedOperation = {
    signature: JSON.stringify({}),
    operation: undefined,
  };

  it("should broadcast", () => {
    broadcast({
      signedOperation,
    } as unknown as BroadcastArg<Account>);
    expect(broadcastLogic).toHaveBeenCalledTimes(1);
  });

  it("should patch operation with hash", () => {
    broadcast({
      signedOperation,
    } as unknown as BroadcastArg<Account>);
    expect(patchOperationSpy).toHaveBeenCalledWith(undefined, "hash");
  });
});
