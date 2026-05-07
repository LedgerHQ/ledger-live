import { DeepPartial } from "@ledgerhq/coin-module-framework/test/utils";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcastTransaction as broadcastLogic } from "../logic/transaction/broadcast";
import broadcast from "./broadcast";

jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../logic/transaction/broadcast");

describe("broadcast", () => {
  let patchOperationSpy: jest.SpyInstance;
  let broadcastSpy: jest.SpyInstance;
  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastSpy = jest.spyOn({ broadcastLogic }, "broadcastLogic");
    broadcastSpy.mockResolvedValue("hash");
  });

  const signedOperation: DeepPartial<SignedOperation> = {
    signature: JSON.stringify({}),
    operation: {} as Operation,
  };

  it("should broadcast", () => {
    broadcast({
      signedOperation,
    } as { signedOperation: SignedOperation });
    expect(broadcastLogic).toHaveBeenCalledTimes(1);
  });

  it("should patch operation with hash", () => {
    broadcast({
      signedOperation,
    } as { signedOperation: SignedOperation });
    expect(patchOperationSpy).toHaveBeenCalledWith({}, "hash");
  });

  it("throws when broadcastTransaction returns no hash", async () => {
    (broadcastLogic as jest.Mock).mockResolvedValueOnce("");
    await expect(
      broadcast({ signedOperation } as { signedOperation: SignedOperation }),
    ).rejects.toThrow("mina: broadcast returned no transaction id");
  });
});
