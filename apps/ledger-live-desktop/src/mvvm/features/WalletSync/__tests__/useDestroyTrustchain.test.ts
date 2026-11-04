import { CloudSyncSDKLocked } from "@shared/cloud-sync";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useDestroyTrustchain } from "../hooks/useDestroyTrustchain";

const mockCloudSyncSdk = { destroy: jest.fn() };
const mockTrustchainSdk = { destroyApplication: jest.fn() };

jest.mock("@features/platform-wallet-sync", () => ({
  ...jest.requireActual<typeof import("@features/platform-wallet-sync")>(
    "@features/platform-wallet-sync",
  ),
  getCloudSyncSdk: () => mockCloudSyncSdk,
}));
jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => mockTrustchainSdk,
}));

const trustchain: Trustchain = {
  rootId: "rootId",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
};
const initialState = {
  trustchain: { trustchain, memberCredentials: { pubkey: "pk", privatekey: "sk" } },
  settings: INITIAL_STATE_SETTINGS,
};

describe("useDestroyTrustchain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrustchainSdk.destroyApplication.mockResolvedValue(undefined);
  });

  it("should retry the deletion while the watch loop holds the Cloud Sync SDK", async () => {
    mockCloudSyncSdk.destroy
      .mockRejectedValueOnce(new CloudSyncSDKLocked("push"))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useDestroyTrustchain(), { initialState });

    await result.current.deleteMutation.mutateAsync();

    expect(mockCloudSyncSdk.destroy).toHaveBeenCalledTimes(2);
    expect(mockTrustchainSdk.destroyApplication).toHaveBeenCalledTimes(1);
  });

  it("should not retry any other failure", async () => {
    mockCloudSyncSdk.destroy.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useDestroyTrustchain(), { initialState });

    await expect(result.current.deleteMutation.mutateAsync()).rejects.toThrow("network down");

    expect(mockCloudSyncSdk.destroy).toHaveBeenCalledTimes(1);
    expect(mockTrustchainSdk.destroyApplication).not.toHaveBeenCalled();
  });
});
