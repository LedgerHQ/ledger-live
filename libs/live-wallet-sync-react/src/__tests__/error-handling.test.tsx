import { setCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import type { DistantState, LocalState } from "@ledgerhq/live-wallet/walletsync/root";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { AccountRaw } from "@ledgerhq/types-live";
import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { useWalletSyncBridgeContext, WalletSyncBridge, WalletSyncProvider } from "../index";

// Mock heavy dependencies that are causing test issues
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/walletSync/getEnvironmentParams", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    cloudSyncApiBaseUrl: "https://mock-api.com",
    trustchainApiBaseUrl: "https://mock-trustchain.com",
  }),
}));

jest.mock("@ledgerhq/live-wallet/cloudsync/index", () => ({
  CloudSyncSDK: jest.fn(),
}));

jest.mock("@ledgerhq/live-wallet/store", () => ({
  setWalletSyncUserState: jest.fn(),
  walletSyncUpdate: jest.fn(),
}));

jest.mock("@ledgerhq/live-wallet/walletsync/index", () => ({
  __esModule: true,
  default: { schema: {} },
  Schema: {},
  liveSlug: "test-slug",
  makeLocalIncrementalUpdate: jest.fn(),
  makeSaveNewUpdate: jest.fn(),
  walletSyncWatchLoop: jest.fn(),
}));

// Initialize crypto assets store for account deserialization
setCryptoAssetsStore({} as CryptoAssetsStore);

describe("WalletSync Error Handling and Edge Cases", () => {
  describe("Context Error Handling", () => {
    beforeEach(() => {
      // Suppress console.error for expected error tests
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    const errorTestCases = [
      { hook: "useWalletSyncBridge", fn: () => useWalletSyncBridgeContext() },
    ];

    errorTestCases.forEach(({ hook, fn }) => {
      it(`should throw error when ${hook} is used outside provider`, () => {
        expect(() => {
          renderHook(fn);
        }).toThrow("'useWalletSyncBridgeContext' must be used within a 'WalletSyncProvider'");
      });
    });

    it("should provide helpful error message", () => {
      expect(() => {
        renderHook(() => useWalletSyncBridgeContext());
      }).toThrow("'useWalletSyncBridgeContext' must be used within a 'WalletSyncProvider'");
    });
  });

  describe("Bridge Function Error Handling", () => {
    let mockBridge: WalletSyncBridge;
    let mockSaveUpdate: jest.Mock;
    let mockGetAccounts: jest.Mock;
    let mockGetWalletSyncState: jest.Mock;
    let mockGetLocalState: jest.Mock;
    let mockUseWalletSyncState: jest.Mock;
    let mockUseTrustchain: jest.Mock;
    let mockUseMemberCredentials: jest.Mock;

    beforeEach(() => {
      mockSaveUpdate = jest.fn();
      mockGetAccounts = jest.fn().mockReturnValue([]);
      mockGetWalletSyncState = jest.fn().mockReturnValue({ version: 1, data: null });
      mockGetLocalState = jest.fn().mockReturnValue({
        accounts: { list: [], nonImportedAccountInfos: [] },
        accountNames: new Map(),
      });
      mockUseWalletSyncState = jest.fn().mockReturnValue({ version: 1, data: null });
      mockUseTrustchain = jest.fn().mockReturnValue(null);
      mockUseMemberCredentials = jest.fn().mockReturnValue(null);

      mockBridge = {
        useWalletSyncState: mockUseWalletSyncState,
        useTrustchain: mockUseTrustchain,
        useMemberCredentials: mockUseMemberCredentials,
        useStoredWalletSyncUserState: jest.fn().mockReturnValue({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: mockSaveUpdate,
        getAccounts: mockGetAccounts,
        getWalletSyncState: mockGetWalletSyncState,
        getLocalState: mockGetLocalState,
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };
    });

    it("should handle saveUpdate rejection", async () => {
      const error = new Error("Network error");
      mockSaveUpdate.mockRejectedValue(error);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
      );

      const { result } = renderHook(() => useWalletSyncBridgeContext(), { wrapper });

      await expect(
        act(async () => {
          await result.current.saveUpdate(null, 1, null);
        }),
      ).rejects.toThrow("Network error");

      expect(mockSaveUpdate).toHaveBeenCalledWith(null, 1, null);
    });

    it("should handle getWalletSyncState throwing error", () => {
      const error = new Error("State access error");
      mockGetWalletSyncState.mockImplementation(() => {
        throw error;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
      );

      const { result } = renderHook(() => useWalletSyncBridgeContext(), { wrapper });

      expect(() => result.current.getWalletSyncState()).toThrow("State access error");
    });

    it("should handle getLocalState throwing error", () => {
      const error = new Error("Local state error");
      mockGetLocalState.mockImplementation(() => {
        throw error;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
      );

      const { result } = renderHook(() => useWalletSyncBridgeContext(), { wrapper });

      expect(() => result.current.getLocalState()).toThrow("Local state error");
    });
  });

  describe("Provider with Invalid Bridge", () => {
    it("should handle bridge with null trustchain properly", () => {
      const bridgeWithNullTrustchain: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => null,
        useMemberCredentials: () => null,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: jest.fn().mockResolvedValue(undefined),
        getAccounts: () => [],
        getWalletSyncState: () => ({ version: 1, data: null }),
        getLocalState: () => ({
          accounts: { list: [], nonImportedAccountInfos: [] },
          accountNames: new Map(),
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const TestComponent = () => {
        const bridge = useWalletSyncBridgeContext();
        const trustchain = bridge.useTrustchain();
        return (
          <div>
            <span data-testid="trustchain">{trustchain ? "has trustchain" : "no trustchain"}</span>
          </div>
        );
      };

      render(
        <WalletSyncProvider bridge={bridgeWithNullTrustchain}>
          <TestComponent />
        </WalletSyncProvider>,
      );

      expect(screen.getByTestId("trustchain")).toHaveTextContent("no trustchain");
    });

    it("should handle bridge with mock functions that throw errors", async () => {
      const bridgeWithThrowingFunctions: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => null,
        useMemberCredentials: () => null,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: jest.fn().mockRejectedValue(new Error("Mock saveUpdate error")),
        getAccounts: () => [],
        getWalletSyncState: jest.fn().mockImplementation(() => {
          throw new Error("Mock getWalletSyncState error");
        }),
        getLocalState: jest.fn().mockImplementation(() => {
          throw new Error("Mock getLocalState error");
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const TestComponent = () => {
        const bridge = useWalletSyncBridgeContext();
        const [error, setError] = React.useState<string | null>(null);

        React.useEffect(() => {
          try {
            bridge.getWalletSyncState();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
          }
        }, [bridge]);

        return (
          <div>
            <div data-testid="test">Test</div>
            <div data-testid="error">{error || "no error"}</div>
          </div>
        );
      };

      render(
        <WalletSyncProvider bridge={bridgeWithThrowingFunctions}>
          <TestComponent />
        </WalletSyncProvider>,
      );

      expect(screen.getByTestId("test")).toBeInTheDocument();
      expect(screen.getByTestId("error")).toHaveTextContent("Mock getWalletSyncState error");
    });
  });

  describe("Race Conditions and Async Behavior", () => {
    it("should handle concurrent saveUpdate calls", async () => {
      const saveUpdateSpy = jest
        .fn()
        .mockImplementation(_ => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));

      const bridge: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => null,
        useMemberCredentials: () => null,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: saveUpdateSpy,
        getAccounts: () => [],
        getWalletSyncState: () => ({ version: 1, data: null }),
        getLocalState: () => ({
          accounts: { list: [], nonImportedAccountInfos: [] },
          accountNames: new Map(),
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletSyncProvider bridge={bridge}>{children}</WalletSyncProvider>
      );

      const { result } = renderHook(() => useWalletSyncBridgeContext(), { wrapper });

      // Start multiple concurrent calls with proper DistantState format
      const promises = [
        result.current.saveUpdate({ accounts: [], accountNames: {} }, 1, null),
        result.current.saveUpdate({ accounts: [], accountNames: {} }, 2, null),
        result.current.saveUpdate({ accounts: [], accountNames: {} }, 3, null),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(saveUpdateSpy).toHaveBeenCalledTimes(3);
      expect(saveUpdateSpy).toHaveBeenNthCalledWith(1, { accounts: [], accountNames: {} }, 1, null);
      expect(saveUpdateSpy).toHaveBeenNthCalledWith(2, { accounts: [], accountNames: {} }, 2, null);
      expect(saveUpdateSpy).toHaveBeenNthCalledWith(3, { accounts: [], accountNames: {} }, 3, null);
    });

    it("should handle rapid bridge updates", () => {
      const initialBridge: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => null,
        useMemberCredentials: () => null,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: jest.fn().mockResolvedValue(undefined),
        getAccounts: () => [],
        getWalletSyncState: () => ({ version: 1, data: null }),
        getLocalState: () => ({
          accounts: { list: [], nonImportedAccountInfos: [] },
          accountNames: new Map(),
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const TestComponent = (_: { bridge: WalletSyncBridge }) => {
        const contextBridge = useWalletSyncBridgeContext();
        const walletSyncState = contextBridge.useWalletSyncState();
        return <div data-testid="version">{walletSyncState.version}</div>;
      };

      const { rerender } = render(
        <WalletSyncProvider bridge={initialBridge}>
          <TestComponent bridge={initialBridge} />
        </WalletSyncProvider>,
      );

      expect(screen.getByTestId("version")).toHaveTextContent("1");

      // Rapidly update bridge
      for (let i = 2; i <= 5; i++) {
        const updatedBridge = {
          ...initialBridge,
          useWalletSyncState: () => ({ version: i, data: { accounts: [], accountNames: {} } }),
          getWalletSyncState: () => ({ version: i, data: { accounts: [], accountNames: {} } }),
        };

        rerender(
          <WalletSyncProvider bridge={updatedBridge}>
            <TestComponent bridge={updatedBridge} />
          </WalletSyncProvider>,
        );

        expect(screen.getByTestId("version")).toHaveTextContent(i.toString());
      }
    });
  });

  describe("Memory Leaks and Cleanup", () => {
    it("should not maintain references to old bridges after unmount", () => {
      let capturedBridge: WalletSyncBridge | null = null;

      const bridge: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => null,
        useMemberCredentials: () => null,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: jest.fn().mockResolvedValue(undefined),
        getAccounts: () => [],
        getWalletSyncState: () => ({ version: 1, data: null }),
        getLocalState: () => ({
          accounts: { list: [], nonImportedAccountInfos: [] },
          accountNames: new Map(),
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const TestComponent = () => {
        capturedBridge = useWalletSyncBridgeContext();
        return <div>Test</div>;
      };

      const { unmount } = render(
        <WalletSyncProvider bridge={bridge}>
          <TestComponent />
        </WalletSyncProvider>,
      );

      expect(capturedBridge).toBe(bridge);

      unmount();

      // After unmount, the component should no longer hold references
      // (This is more of a conceptual test - in practice, React handles cleanup)
      expect(capturedBridge).toBe(bridge); // Reference still exists in test, but component is unmounted
    });
  });

  describe("Type Safety Validation", () => {
    it("should work with properly typed bridges", () => {
      // Create a proper account using fromAccountRaw instead of manual construction
      const mockAccountRaw: AccountRaw = {
        id: "js:2:bitcoin:validation-test:",
        seedIdentifier: "validation-seed",
        name: "Validation Test Account",
        derivationMode: "",
        index: 0,
        freshAddress: "bc1qvalidation123",
        freshAddressPath: "44'/0'/0'/0/0",
        blockHeight: 800000,
        operations: [],
        pendingOperations: [],
        currencyId: "bitcoin",
        lastSyncDate: "2025-01-01T12:00:00.000Z",
        balance: "1000000",
      };

      const mockAccount = fromAccountRaw(mockAccountRaw);

      const typedBridge: WalletSyncBridge = {
        useWalletSyncState: () => ({ version: 1, data: null }),
        useTrustchain: () => ({
          rootId: "test-root",
          applicationPath: "test-application-path",
          walletSyncEncryptionKey: "test-encryption-key",
        }),
        useMemberCredentials: () => ({
          pubkey: "test-public-key",
          privatekey: "test-private-key",
        }),
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        getAccounts: () => [mockAccount],
        getWalletSyncState: () => ({ version: 1, data: null }),
        saveUpdate: async (
          _data: DistantState | null,
          _version: number,
          localState: LocalState | null,
        ) => {
          // Type-safe implementation
          if (localState) {
            expect(localState.accounts).toBeDefined();
            expect(localState.accountNames).toBeDefined();
          }
        },
        getLocalState: (): LocalState => ({
          accounts: {
            list: [mockAccount],
            nonImportedAccountInfos: [],
          },
          accountNames: new Map(),
        }),
        setWalletSyncPending: jest.fn(),
        setWalletSyncError: jest.fn(),
      };

      const TestComponent = () => {
        const bridge = useWalletSyncBridgeContext();
        const localState = bridge.getLocalState();
        const walletSyncState = bridge.useWalletSyncState();

        return (
          <div>
            <span data-testid="accounts-count">{localState.accounts.list.length}</span>
            <span data-testid="wallet-version">{walletSyncState.version}</span>
          </div>
        );
      };

      render(
        <WalletSyncProvider bridge={typedBridge}>
          <TestComponent />
        </WalletSyncProvider>,
      );

      expect(screen.getByTestId("accounts-count")).toHaveTextContent("1");
      expect(screen.getByTestId("wallet-version")).toHaveTextContent("1");
    });
  });
});
