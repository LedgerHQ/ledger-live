import {
  createBitcoinGetAddressHandler,
  createBitcoinGetAddressesHandler,
  createBitcoinGetPublicKeyHandler,
  createBitcoinGetXPubHandler,
} from "../bitcoin";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";
import { createFixtureAccount } from "../../logic/__tests__/testHelpers";
import type { TrackingAPI } from "../../tracking";

// A plain (non-Proxy) tracking object so `toHaveBeenCalledWith` can deep-equal the
// context the handlers forward (the shared Proxy spy is not safely iterable by matchers).
const plainTracking = {} as TrackingAPI;

jest.mock("../../logic/bitcoin", () => ({
  bitcoinFamilyAccountGetAddressLogic: jest.fn(() => Promise.resolve("address")),
  bitcoinFamilyAccountGetAddressesLogic: jest.fn(() => Promise.resolve(["address"])),
  bitcoinFamilyAccountGetPublicKeyLogic: jest.fn(() => Promise.resolve("pubkey")),
  bitcoinFamilyAccountGetXPubLogic: jest.fn(() => Promise.resolve("xpub")),
}));

import {
  bitcoinFamilyAccountGetAddressLogic,
  bitcoinFamilyAccountGetAddressesLogic,
  bitcoinFamilyAccountGetPublicKeyLogic,
  bitcoinFamilyAccountGetXPubLogic,
} from "../../logic/bitcoin";

describe("bitcoin handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createBitcoinGetAddressHandler forwards context + args to the logic", async () => {
    const accounts = [createFixtureAccount("a")];
    const deps = makeHandlerDeps({ accounts, tracking: plainTracking });
    const handler = createBitcoinGetAddressHandler(getDepsFrom(deps));

    await expect(handler({ accountId: "acc-1", derivationPath: "0/0" })).resolves.toBe("address");
    expect(bitcoinFamilyAccountGetAddressLogic).toHaveBeenCalledWith(
      {
        manifest: deps.manifest,
        accounts: deps.accounts,
        tracking: deps.tracking,
      },
      "acc-1",
      "0/0",
    );
  });

  it("createBitcoinGetAddressesHandler forwards context + intentions to the logic", async () => {
    const deps = makeHandlerDeps({ tracking: plainTracking });
    const handler = createBitcoinGetAddressesHandler(getDepsFrom(deps));
    const intentions = [
      {
        purpose: "84",
        coinType: "0",
        accountIndex: 0,
        isChange: false,
        addressIndex: 0,
      },
    ];

    await expect(handler({ accountId: "acc-2", intentions } as never)).resolves.toEqual([
      "address",
    ]);
    expect(bitcoinFamilyAccountGetAddressesLogic).toHaveBeenCalledWith(
      {
        manifest: deps.manifest,
        accounts: deps.accounts,
        tracking: deps.tracking,
      },
      "acc-2",
      intentions,
    );
  });

  it("createBitcoinGetPublicKeyHandler forwards context + args to the logic", async () => {
    const deps = makeHandlerDeps({ tracking: plainTracking });
    const handler = createBitcoinGetPublicKeyHandler(getDepsFrom(deps));

    await expect(handler({ accountId: "acc-3", derivationPath: "1/2" })).resolves.toBe("pubkey");
    expect(bitcoinFamilyAccountGetPublicKeyLogic).toHaveBeenCalledWith(
      {
        manifest: deps.manifest,
        accounts: deps.accounts,
        tracking: deps.tracking,
      },
      "acc-3",
      "1/2",
    );
  });

  it("createBitcoinGetXPubHandler forwards context + accountId to the logic", async () => {
    const deps = makeHandlerDeps({ tracking: plainTracking });
    const handler = createBitcoinGetXPubHandler(getDepsFrom(deps));

    await expect(handler({ accountId: "acc-4" })).resolves.toBe("xpub");
    expect(bitcoinFamilyAccountGetXPubLogic).toHaveBeenCalledWith(
      {
        manifest: deps.manifest,
        accounts: deps.accounts,
        tracking: deps.tracking,
      },
      "acc-4",
    );
  });
});
