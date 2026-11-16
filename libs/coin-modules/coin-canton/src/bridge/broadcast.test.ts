import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { createMockContext } from "../test/fixtures";
import { broadcast } from "./broadcast";

jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../logic/broadcast");

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
    broadcast(createMockContext(), {
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
    broadcast(createMockContext(), {
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
