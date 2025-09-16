import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../common-logic");
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast as broadcastLogic } from "../common-logic";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

describe("broadcast", () => {
  let patchOperationSpy: jest.SpyInstance;
  let broadcastSpy: jest.SpyInstance;
  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastSpy = jest.spyOn({ broadcastLogic }, "broadcastLogic");
    broadcastSpy.mockResolvedValue("hash");
  });

  it("should broadcast", () => {
    broadcast({
      account: {
        currency: mockCurrency,
      },
      signedOperation: {
        signature: undefined,
        operation: undefined,
      },
    } as unknown as BroadcastArg<Account>);
    expect(broadcastLogic).toHaveBeenCalledTimes(1);
  });

  it("should patch operation with hash", () => {
    broadcast({
      account: {
        currency: mockCurrency,
      },
      signedOperation: {
        signature: undefined,
        operation: undefined,
      },
    } as unknown as BroadcastArg<Account>);
    expect(patchOperationSpy).toHaveBeenCalledWith(undefined, "hash");
  });
});
