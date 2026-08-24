import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useContactsLedgerSyncStatus } from "./useContactsLedgerSyncStatus";

jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: jest.fn(),
}));

const mockedUseWalletSyncUserState = jest.mocked(useWalletSyncUserState);

function renderContactsLedgerSyncStatus({
  isWalletSyncEnabled = true,
  visualPending = false,
  walletSyncError = null,
  rootId,
}: {
  isWalletSyncEnabled?: boolean;
  visualPending?: boolean;
  walletSyncError?: Error | null;
  rootId?: string;
} = {}) {
  mockedUseWalletSyncUserState.mockReturnValue({
    visualPending,
    walletSyncError,
    onUserRefresh: jest.fn(),
  });

  return renderHook(() => useContactsLedgerSyncStatus(), {
    initialState: {
      ...withFlagOverrides({ lldWalletSync: { enabled: isWalletSyncEnabled } }),
      trustchain: {
        trustchain: rootId
          ? {
              rootId,
              applicationPath: "applicationPath",
              walletSyncEncryptionKey: "walletSyncEncryptionKey",
            }
          : null,
      },
    },
  });
}

describe("useContactsLedgerSyncStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should be unavailable when Wallet Sync is disabled", () => {
    const { result } = renderContactsLedgerSyncStatus({ isWalletSyncEnabled: false });

    expect(result.current).toBe("unavailable");
  });

  it("should be unavailable when Wallet Sync reports an error", () => {
    const { result } = renderContactsLedgerSyncStatus({
      walletSyncError: new Error("Sync failed"),
    });

    expect(result.current).toBe("unavailable");
  });

  it("should be checking while Wallet Sync is pending", () => {
    const { result } = renderContactsLedgerSyncStatus({ visualPending: true });

    expect(result.current).toBe("checking");
  });

  it("should be ready when the trustchain is initialized", () => {
    const { result } = renderContactsLedgerSyncStatus({ rootId: "trustchain-root" });

    expect(result.current).toBe("ready");
  });

  it("should be inactive when the trustchain is not initialized", () => {
    const { result } = renderContactsLedgerSyncStatus();

    expect(result.current).toBe("inactive");
  });
});
