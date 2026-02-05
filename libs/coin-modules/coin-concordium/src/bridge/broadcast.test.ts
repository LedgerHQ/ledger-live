import type { BroadcastArg } from "@ledgerhq/types-live";
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../logic");
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast as broadcastLogic } from "../logic";
import { createTestAccount } from "../test/testHelpers";
import { broadcast } from "./broadcast";

const createBroadcastArg = (
  overrides?: Partial<BroadcastArg<ReturnType<typeof createTestAccount>>>,
): BroadcastArg<ReturnType<typeof createTestAccount>> => ({
  account: createTestAccount(),
  signedOperation: {
    signature: "",
    operation: {
      id: "",
      hash: "",
      type: "OUT",
      value: "0",
      fee: "0",
      senders: [],
      recipients: [],
      blockHeight: null,
      blockHash: null,
      accountId: "",
      date: new Date(),
      extra: {},
    },
  },
  ...overrides,
});

describe("broadcast", () => {
  let patchOperationSpy: jest.SpyInstance;
  let broadcastSpy: jest.SpyInstance;
  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastSpy = jest.spyOn({ broadcastLogic }, "broadcastLogic");
    broadcastSpy.mockResolvedValue("hash");
  });

  it("should broadcast", async () => {
    await broadcast(createBroadcastArg());
    expect(broadcastLogic).toHaveBeenCalledTimes(1);
  });

  it("should patch operation with hash", async () => {
    const broadcastArg = createBroadcastArg();
    await broadcast(broadcastArg);
    expect(patchOperationSpy).toHaveBeenCalledWith(broadcastArg.signedOperation.operation, "hash");
  });
});
