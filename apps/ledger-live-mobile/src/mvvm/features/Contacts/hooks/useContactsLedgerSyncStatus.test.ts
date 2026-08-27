import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useLedgerSyncStatus } from "LLM/features/WalletSync/hooks/useLedgerSyncStatus";
import { useContactsLedgerSyncStatus } from "./useContactsLedgerSyncStatus";

jest.mock("LLM/features/WalletSync/hooks/useLedgerSyncStatus", () => ({
  useLedgerSyncStatus: jest.fn(),
}));

const mockedUseLedgerSyncStatus = jest.mocked(useLedgerSyncStatus);

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
  mockedUseLedgerSyncStatus.mockReturnValue({ isLoading, isError } as ReturnType<
    typeof useLedgerSyncStatus
  >);

  return renderHook(() => useContactsLedgerSyncStatus(), {
    overrideInitialState: withFlagOverrides(
      { llmWalletSync: { enabled: isWalletSyncEnabled } },
      s => ({
        ...s,
        trustchain: {
          ...s.trustchain,
          trustchain: rootId
            ? {
                rootId,
                applicationPath: "applicationPath",
                walletSyncEncryptionKey: "walletSyncEncryptionKey",
              }
            : null,
        },
      }),
    ),
  });
}

describe("useContactsLedgerSyncStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should be unavailable when Wallet Sync is disabled", () => {
    const { result } = renderContactsLedgerSyncStatus({ isWalletSyncEnabled: false });

    expect(result.current).toBe("unavailable");
  });

  it("should be unavailable when the Ledger Sync services are unavailable", () => {
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
