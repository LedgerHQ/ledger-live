import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useLedgerSyncInfo } from "LLD/features/WalletSync/hooks/useLedgerSyncInfo";
import { useContactsLedgerSyncStatus } from "./useContactsLedgerSyncStatus";

jest.mock("LLD/features/WalletSync/hooks/useLedgerSyncInfo", () => ({
  useLedgerSyncInfo: jest.fn(),
}));

const mockedUseLedgerSyncInfo = jest.mocked(useLedgerSyncInfo);

function renderContactsLedgerSyncStatus({
  isWalletSyncEnabled = true,
  isLoading = false,
  isError = false,
  rootId,
}: {
  isWalletSyncEnabled?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  rootId?: string;
} = {}) {
  mockedUseLedgerSyncInfo.mockReturnValue({
    statusQuery: { error: isError ? new Error("Sync failed") : null, isError, isLoading },
    trustchain: rootId
      ? {
          rootId,
          applicationPath: "applicationPath",
          walletSyncEncryptionKey: "walletSyncEncryptionKey",
        }
      : null,
    walletState: {},
  } as ReturnType<typeof useLedgerSyncInfo>);

  return renderHook(() => useContactsLedgerSyncStatus(), {
    initialState: withFlagOverrides({ lldWalletSync: { enabled: isWalletSyncEnabled } }),
  });
}

describe("useContactsLedgerSyncStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should be unavailable when Wallet Sync is disabled", () => {
    const { result } = renderContactsLedgerSyncStatus({ isWalletSyncEnabled: false });

    expect(result.current).toBe("unavailable");
  });

  it("should be unavailable when Ledger Sync reports an error", () => {
    const { result } = renderContactsLedgerSyncStatus({ isError: true });

    expect(result.current).toBe("unavailable");
  });

  it("should be checking while the Ledger Sync status is loading", () => {
    const { result } = renderContactsLedgerSyncStatus({ isLoading: true });

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
