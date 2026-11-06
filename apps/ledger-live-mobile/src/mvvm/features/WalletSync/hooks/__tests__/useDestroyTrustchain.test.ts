import React from "react";
import { CloudSyncSDKLocked } from "@shared/cloud-sync";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useDestroyTrustchain } from "../useDestroyTrustchain";

const mockCloudSyncSdk = { destroy: jest.fn() };
const mockTrustchainSdk = { destroyApplication: jest.fn() };

jest.mock("@features/platform-wallet-sync", () => ({
  ...jest.requireActual<typeof import("@features/platform-wallet-sync")>(
    "@features/platform-wallet-sync",
  ),
  getCloudSyncSdk: () => mockCloudSyncSdk,
}));
jest.mock("../useTrustchainSdk", () => ({
  useTrustchainSdk: () => mockTrustchainSdk,
}));

const trustchain: Trustchain = {
  rootId: "rootId",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
};
const withTrustchain = (state: State): State => ({
  ...state,
  trustchain: { trustchain, memberCredentials: { pubkey: "pk", privatekey: "sk" } },
});

describe("useDestroyTrustchain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockTrustchainSdk.destroyApplication.mockResolvedValue(undefined);
    mockCloudSyncSdk.destroy.mockRejectedValue(new CloudSyncSDKLocked("pull"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should retry the deletion until the watch loop releases the Cloud Sync SDK", async () => {
    const { result } = renderDestroyTrustchain();

    const deletion = result.current.deleteMutation.mutateAsync();
    await jest.advanceTimersByTimeAsync(20_000);
    mockCloudSyncSdk.destroy.mockResolvedValue(undefined);
    await jest.advanceTimersByTimeAsync(500);
    await deletion;

    expect(mockCloudSyncSdk.destroy).toHaveBeenCalledTimes(42);
    expect(mockTrustchainSdk.destroyApplication).toHaveBeenCalledTimes(1);
  });

  it("should give up once the Cloud Sync SDK stays locked for 30 seconds", async () => {
    const { result } = renderDestroyTrustchain();

    const deletion = result.current.deleteMutation.mutateAsync().catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(30_000);

    expect(await deletion).toBeInstanceOf(CloudSyncSDKLocked);
    expect(mockCloudSyncSdk.destroy).toHaveBeenCalledTimes(61);
    expect(mockTrustchainSdk.destroyApplication).not.toHaveBeenCalled();
  });

  it("should not retry any other failure", async () => {
    mockCloudSyncSdk.destroy.mockRejectedValue(new Error("network down"));
    const { result } = renderDestroyTrustchain();

    await expect(result.current.deleteMutation.mutateAsync()).rejects.toThrow("network down");

    expect(mockCloudSyncSdk.destroy).toHaveBeenCalledTimes(1);
    expect(mockTrustchainSdk.destroyApplication).not.toHaveBeenCalled();
  });
});

function renderDestroyTrustchain() {
  const client = new QueryClient();
  const QueryClientWrapper = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useDestroyTrustchain(), {
    overrideInitialState: withTrustchain,
    innerWrapper: QueryClientWrapper,
  });
}
