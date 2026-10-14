import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { createBoilerplateContext } from "../config.fixture";
import { buildBroadcast } from "./broadcast";

jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../logic/broadcast");

describe("broadcast", () => {
  const broadcast = buildBroadcast(createBoilerplateContext());
  let patchOperationSpy: jest.SpyInstance;
  let broadcastSpy: jest.SpyInstance;
  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastSpy = jest.spyOn({ broadcastLogic }, "broadcastLogic");
    broadcastSpy.mockResolvedValue("hash");
  });

  it("should broadcast", async () => {
    await broadcast({
      signedOperation: {
        signature: undefined,
        operation: undefined,
      },
    } as unknown as BroadcastArg<Account>);
    expect(broadcastLogic).toHaveBeenCalledTimes(1);
  });

  it("should patch operation with hash", async () => {
    await broadcast({
      signedOperation: {
        signature: undefined,
        operation: undefined,
      },
    } as unknown as BroadcastArg<Account>);
    expect(patchOperationSpy).toHaveBeenCalledWith(undefined, "hash");
  });
});
