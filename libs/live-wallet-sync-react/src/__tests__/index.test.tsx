import { setCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/lib/types";
import type { WSState } from "@ledgerhq/live-wallet/lib/store";
import type { DistantState, LocalState } from "@ledgerhq/live-wallet/lib/walletsync/root";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { AccountRaw } from "@ledgerhq/types-live";
import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import {
  useWalletSyncAccounts,
  useWalletSyncBridgeContext,
  useWalletSyncLocalState,
  useWalletSyncMemberCredentials,
  useWalletSyncSaveUpdate,
  useWalletSyncState,
  useWalletSyncTrustchain,
  WalletSyncBridge,
  WalletSyncProvider,
} from "../index";

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
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStore({} as CryptoAssetsStore);

// Mock data using proper AccountRaw and fromAccountRaw
const mockBtcAccountRaw: AccountRaw = {
  id: "js:2:bitcoin:shared-lib-btc-1:",
  seedIdentifier: "shared-lib-btc-seed",
  name: "Shared Lib Bitcoin Account",
  derivationMode: "",
  index: 0,
  freshAddress: "bc1qsharedlibtest123",
  freshAddressPath: "44'/0'/0'/0/0",
  blockHeight: 800000,
  operations: [],
  pendingOperations: [],
  currencyId: "bitcoin",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "100000000", // 1 BTC
};

const mockAccount = fromAccountRaw(mockBtcAccountRaw);

const mockWSState: WSState = {
  version: 1,
  data: null,
};

const mockTrustchain: Trustchain = {
  rootId: "test-root-id",
  applicationPath: "test-path",
  walletSyncEncryptionKey: "test-key",
};

const mockMemberCredentials: MemberCredentials = {
  privatekey: "test-private-key",
  pubkey: "test-pub-key",
};

const mockLocalState: LocalState = {
  accounts: {
    list: [mockAccount],
    nonImportedAccountInfos: [],
  },
  accountNames: new Map([["test-account-1", "Test Account"]]),
};

describe("WalletSync React Library", () => {
  describe("WalletSyncProvider and Context", () => {
    let mockBridge: WalletSyncBridge;
    let mockSaveUpdate: jest.Mock;
    let mockGetAccounts: jest.Mock;
    let mockGetWalletSyncState: jest.Mock;
    let mockGetLocalState: jest.Mock;
    let mockUseWalletSyncState: jest.Mock;
    let mockUseTrustchain: jest.Mock;
    let mockUseMemberCredentials: jest.Mock;

    beforeEach(() => {
      mockSaveUpdate = jest.fn().mockResolvedValue(undefined);
      mockGetAccounts = jest.fn().mockReturnValue([mockAccount]);
      mockGetWalletSyncState = jest.fn().mockReturnValue(mockWSState);
      mockGetLocalState = jest.fn().mockReturnValue(mockLocalState);
      mockUseWalletSyncState = jest.fn().mockReturnValue(mockWSState);
      mockUseTrustchain = jest.fn().mockReturnValue(mockTrustchain);
      mockUseMemberCredentials = jest.fn().mockReturnValue(mockMemberCredentials);

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
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("Provider Setup", () => {
      it("should render children when bridge is provided", () => {
        render(
          <WalletSyncProvider bridge={mockBridge}>
            <div data-testid="child">Test Child</div>
          </WalletSyncProvider>,
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
        expect(screen.getByText("Test Child")).toBeInTheDocument();
      });

      it("should provide bridge context to children", () => {
        let capturedBridge: WalletSyncBridge | null = null;

        function TestComponent() {
          capturedBridge = useWalletSyncBridgeContext();
          return <div>Test</div>;
        }

        render(
          <WalletSyncProvider bridge={mockBridge}>
            <TestComponent />
          </WalletSyncProvider>,
        );

        expect(capturedBridge).toBe(mockBridge);
      });
    });

    // Note: Error handling tests are covered in error-handling.test.tsx

    describe("useWalletSyncState", () => {
      it("should return wallet sync state from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncState(), { wrapper });

        expect(result.current).toBe(mockWSState);
        expect(mockUseWalletSyncState).toHaveBeenCalled();
      });

      it("should update when bridge state changes", () => {
        let capturedState: WSState | null = null;

        const TestComponent = (_: { bridge: WalletSyncBridge }) => {
          capturedState = useWalletSyncState();
          return null;
        };

        const { rerender } = render(
          <WalletSyncProvider bridge={mockBridge}>
            <TestComponent bridge={mockBridge} />
          </WalletSyncProvider>,
        );

        expect(capturedState).toBe(mockWSState);

        // Update the bridge with new state
        const newWSState = { version: 2, data: {} };
        const newMockUseWalletSyncState = jest.fn().mockReturnValue(newWSState);
        const newBridge = { ...mockBridge, useWalletSyncState: newMockUseWalletSyncState };

        rerender(
          <WalletSyncProvider bridge={newBridge}>
            <TestComponent bridge={newBridge} />
          </WalletSyncProvider>,
        );

        expect(capturedState).toBe(newWSState);
      });
    });

    describe("useWalletSyncTrustchain", () => {
      it("should return trustchain from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncTrustchain(), { wrapper });

        expect(result.current).toBe(mockTrustchain);
        expect(mockUseTrustchain).toHaveBeenCalled();
      });

      it("should return null when trustchain is null", () => {
        const mockUseTrustchainNull = jest.fn().mockReturnValue(null);
        const bridgeWithoutTrustchain = { ...mockBridge, useTrustchain: mockUseTrustchainNull };
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={bridgeWithoutTrustchain}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncTrustchain(), { wrapper });

        expect(result.current).toBeNull();
        expect(mockUseTrustchainNull).toHaveBeenCalled();
      });
    });

    describe("useWalletSyncMemberCredentials", () => {
      it("should return member credentials from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncMemberCredentials(), { wrapper });

        expect(result.current).toBe(mockMemberCredentials);
        expect(mockUseMemberCredentials).toHaveBeenCalled();
      });

      it("should return null when member credentials is null", () => {
        const mockUseMemberCredentialsNull = jest.fn().mockReturnValue(null);
        const bridgeWithoutCredentials = {
          ...mockBridge,
          useMemberCredentials: mockUseMemberCredentialsNull,
        };
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={bridgeWithoutCredentials}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncMemberCredentials(), { wrapper });

        expect(result.current).toBeNull();
        expect(mockUseMemberCredentialsNull).toHaveBeenCalled();
      });
    });

    describe("useWalletSyncAccounts", () => {
      it("should return getAccounts function from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncAccounts(), { wrapper });

        expect(result.current).toBe(mockGetAccounts);
        expect(typeof result.current).toBe("function");
      });

      it("should call getAccounts and return accounts array", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncAccounts(), { wrapper });

        const accounts = result.current();
        expect(mockGetAccounts).toHaveBeenCalled();
        expect(accounts).toEqual([mockAccount]);
      });
    });

    describe("useWalletSyncSaveUpdate", () => {
      it("should return saveUpdate function from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncSaveUpdate(), { wrapper });

        expect(result.current).toBe(mockSaveUpdate);
        expect(typeof result.current).toBe("function");
      });

      it("should call saveUpdate with correct parameters", async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncSaveUpdate(), { wrapper });

        const distantState: DistantState = {};
        const version = 2;
        const localState = mockLocalState;

        await act(async () => {
          await result.current(distantState, version, localState);
        });

        expect(mockSaveUpdate).toHaveBeenCalledWith(distantState, version, localState);
      });

      it("should handle null parameters", async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncSaveUpdate(), { wrapper });

        await act(async () => {
          await result.current(null, 0, null);
        });

        expect(mockSaveUpdate).toHaveBeenCalledWith(null, 0, null);
      });
    });

    describe("useWalletSyncLocalState", () => {
      it("should return getLocalState function from bridge", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncLocalState(), { wrapper });

        expect(result.current).toBe(mockGetLocalState);
        expect(typeof result.current).toBe("function");
      });

      it("should call getLocalState with no parameters", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncLocalState(), { wrapper });

        const localState = result.current();
        expect(mockGetLocalState).toHaveBeenCalledWith();
        expect(localState).toBe(mockLocalState);
      });
    });

    describe("useWalletSyncBridge", () => {
      it("should return complete bridge object", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <WalletSyncProvider bridge={mockBridge}>{children}</WalletSyncProvider>
        );

        const { result } = renderHook(() => useWalletSyncBridgeContext(), { wrapper });

        expect(result.current).toBe(mockBridge);
        expect(result.current.useWalletSyncState).toBe(mockUseWalletSyncState);
        expect(result.current.useTrustchain).toBe(mockUseTrustchain);
        expect(result.current.useMemberCredentials).toBe(mockUseMemberCredentials);
        expect(result.current.getAccounts).toBe(mockGetAccounts);
        expect(result.current.getWalletSyncState).toBe(mockGetWalletSyncState);
        expect(result.current.saveUpdate).toBe(mockSaveUpdate);
        expect(result.current.getLocalState).toBe(mockGetLocalState);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should work with realistic workflow", async () => {
      let currentWSState = mockWSState;
      const saveUpdateMock = jest
        .fn()
        .mockImplementation(
          (data: DistantState | null, version: number, newLocalState: LocalState | null) => {
            // Simulate state update
            if (newLocalState) {
              currentWSState = { version, data };
            }
            return Promise.resolve();
          },
        );

      const bridge: WalletSyncBridge = {
        useWalletSyncState: () => currentWSState,
        useTrustchain: () => mockTrustchain,
        useMemberCredentials: () => mockMemberCredentials,
        useStoredWalletSyncUserState: () => ({
          visualPending: false,
          walletSyncError: null,
        }),
        saveUpdate: saveUpdateMock,
        getAccounts: () => [mockAccount],
        getWalletSyncState: () => currentWSState,
        getLocalState: () => mockLocalState,
      };

      const TestWorkflowComponent = () => {
        const walletSyncBridge = useWalletSyncBridgeContext();
        const saveUpdate = useWalletSyncSaveUpdate();
        const getLocalState = useWalletSyncLocalState();
        const trustchain = walletSyncBridge.useTrustchain();
        const memberCredentials = walletSyncBridge.useMemberCredentials();
        const walletSyncState = walletSyncBridge.useWalletSyncState();

        React.useEffect(() => {
          // Simulate a wallet sync operation
          const performSync = async () => {
            const localState = getLocalState();
            const newDistantState: DistantState = {};

            await saveUpdate(newDistantState, 2, localState);
          };

          performSync();
        }, [getLocalState, saveUpdate]);

        return (
          <div data-testid="workflow">
            <span data-testid="trustchain-id">{trustchain?.rootId}</span>
            <span data-testid="member-key">{memberCredentials?.pubkey}</span>
            <span data-testid="version">{walletSyncState.version}</span>
          </div>
        );
      };

      render(
        <WalletSyncProvider bridge={bridge}>
          <TestWorkflowComponent />
        </WalletSyncProvider>,
      );

      expect(screen.getByTestId("workflow")).toBeInTheDocument();
      expect(screen.getByTestId("trustchain-id")).toHaveTextContent("test-root-id");
      expect(screen.getByTestId("member-key")).toHaveTextContent("test-pub-key");
      expect(screen.getByTestId("version")).toHaveTextContent("1");

      // Wait for the async operation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(saveUpdateMock).toHaveBeenCalledWith({}, 2, mockLocalState);
    });
  });
});
