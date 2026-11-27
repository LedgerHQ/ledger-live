import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import type { CantonContext } from "../config";
import { createMockCoinConfigValue, createMockContext } from "../test/fixtures";
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

  it("should broadcast", async () => {
    await broadcast(createMockContext(), {
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

  it("should patch operation with hash", async () => {
    await broadcast(createMockContext(), {
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

  it("should broadcast under a context pinned to the config of the account's currency", async () => {
    const currencyConfig = createMockCoinConfigValue({ gatewayUrl: "https://currency.test" });
    const context: CantonContext = {
      config: async currencyId =>
        currencyId === mockCurrency.id ? currencyConfig : createMockCoinConfigValue(),
      logger: () => {},
    };

    await broadcast(context, {
      account: { currency: mockCurrency },
      signedOperation: { signature: undefined, operation: undefined },
    } as unknown as BroadcastArg<Account>);

    const [pinned] = jest.mocked(broadcastLogic).mock.lastCall ?? [];
    if (!pinned) throw new Error("broadcastLogic was not called");
    await expect(pinned.config()).resolves.toBe(currencyConfig);
    await expect(pinned.config("other")).resolves.toBe(currencyConfig);
  });
});
