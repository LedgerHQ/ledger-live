import { setWalletSyncStateHydrated } from "@domain/entity-wallet-sync";
import { getKey } from "~/renderer/storage";
import { fetchWallet } from "./wallet";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

describe("fetchWallet", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mark Wallet Sync hydrated only after the storage read completes", async () => {
    let resolveGetKey: (() => void) | undefined;
    jest.mocked(getKey).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveGetKey = () => resolve(undefined);
        }),
    );

    const fetch = fetchWallet()(dispatch, jest.fn(), undefined);
    expect(dispatch).not.toHaveBeenCalled();

    if (!resolveGetKey) throw new Error("Storage read did not start");
    resolveGetKey();
    await fetch;

    expect(dispatch).toHaveBeenCalledWith(setWalletSyncStateHydrated());
  });
});
