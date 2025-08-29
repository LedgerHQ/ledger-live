import { setCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  useWalletSyncMemberCredentials,
  useWalletSyncState,
  useWalletSyncTrustchain,
} from "@ledgerhq/live-wallet-sync-react";
import { WSState, WalletState } from "@ledgerhq/live-wallet/store";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { AccountRaw } from "@ledgerhq/types-live";
import { configureStore } from "@reduxjs/toolkit";
import { act, render, renderHook } from "@testing-library/react-native";
import React from "react";
import { Provider } from "react-redux";
import { State } from "~/reducers/types";
import { WalletSyncProvider, useMobileWalletSyncBridge } from "../WalletSyncProvider";

// Initialize crypto assets store for account deserialization
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStore({} as CryptoAssetsStore);

interface TrustchainStore {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
}

// Mock dependencies
const mockUseWalletSyncBridgeFromLib = jest.fn();

jest.mock("@ledgerhq/live-wallet-sync-react", () => ({
  ...jest.requireActual("@ledgerhq/live-wallet-sync-react"),
  WalletSyncProvider: ({ children, bridge }: { children: React.ReactNode; bridge: unknown }) => {
    // Store the bridge in context for tests
    mockUseWalletSyncBridgeFromLib.mockReturnValue(bridge);
    return <>{children}</>;
  },
  useWalletSyncBridge: () => mockUseWalletSyncBridgeFromLib(),
  useWalletSyncState: jest.fn(),
  useWalletSyncTrustchain: jest.fn(),
  useWalletSyncMemberCredentials: jest.fn(),
  useWatchWalletSync: jest.fn(() => ({})), // Mock this to prevent context errors
}));

// Mock the mobile hook that uses useWatchWalletSync with proper return structure
jest.mock("~/newArch/features/WalletSync/hooks/useWalletSyncMobile", () => ({
  useWalletSyncMobile: jest.fn(() => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: jest.fn(),
  })),
}));

// Mock data - using proper AccountRaw and fromAccountRaw
const mockEthAccountRaw: AccountRaw = {
  id: "js:2:ethereum:0xmobile123:",
  seedIdentifier: "mobile-eth-seed",
  name: "Mobile Ethereum Account",
  derivationMode: "",
  index: 0,
  freshAddress: "0xmobile123",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 18500000,
  operations: [],
  pendingOperations: [],
  currencyId: "ethereum",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "3000000000000000000", // 3 ETH
};

const mockPolygonAccountRaw: AccountRaw = {
  id: "js:2:polygon:0xmobilepolygon:",
  seedIdentifier: "mobile-polygon-seed",
  name: "Mobile Polygon Account",
  derivationMode: "",
  index: 1,
  freshAddress: "0xmobilepolygon",
  freshAddressPath: "44'/60'/0'/0/1",
  blockHeight: 50000000,
  operations: [],
  pendingOperations: [],
  currencyId: "polygon",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "5000000000000000000", // 5 MATIC
};

const mockBtcAccountRaw: AccountRaw = {
  id: "js:2:bitcoin:mobile456:",
  seedIdentifier: "mobile-btc-seed",
  name: "Mobile Bitcoin Account",
  derivationMode: "",
  index: 2,
  freshAddress: "bc1qmobile456",
  freshAddressPath: "44'/0'/0'/0/0",
  blockHeight: 820000,
  operations: [],
  pendingOperations: [],
  currencyId: "bitcoin",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "50000000", // 0.5 BTC
};

const mockEthAccount = fromAccountRaw(mockEthAccountRaw);
const mockPolygonAccount = fromAccountRaw(mockPolygonAccountRaw);
const mockBtcAccount = fromAccountRaw(mockBtcAccountRaw);

const mockWSState: WSState = {
  version: 5,
  data: null,
};

const mockWalletState: WalletState = {
  walletSyncState: mockWSState,
  nonImportedAccountInfos: [
    {
      id: "non-imported-mobile-1",
      attempts: 1,
      attemptsLastTimestamp: Date.now(),
      error: {
        name: "ImportError",
        message: "Failed to import account",
      },
    },
  ],
  accountNames: new Map([
    [mockEthAccount.id, "Mobile Ethereum Account"],
    [mockPolygonAccount.id, "Mobile Polygon Account"],
    [mockBtcAccount.id, "Mobile Bitcoin Account"],
  ]),
  starredAccountIds: new Set([mockEthAccount.id, mockBtcAccount.id]),
  walletSyncUserState: {
    visualPending: false,
    walletSyncError: null,
  },
};

const mockTrustchain: Trustchain = {
  rootId: "mobile-root-id",
  applicationPath: "mobile-path",
  walletSyncEncryptionKey: "mobile-key",
};

const mockMemberCredentials: MemberCredentials = {
  privatekey: "mobile-private-key",
  pubkey: "mobile-pub-key",
};

const mockTrustchainStore: TrustchainStore = {
  trustchain: mockTrustchain,
  memberCredentials: mockMemberCredentials,
};

const createMockMobileState = (): State =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    accounts: { active: [mockEthAccount, mockPolygonAccount, mockBtcAccount] }, // Mobile format: { active: Account[] }
    wallet: mockWalletState,
    trustchain: mockTrustchainStore,
    appstate: {},
    assetsDataApi: {},
    auth: {},
    ble: {},
    countervalues: {},
    dynamicContent: {},
    earn: {},
    inView: {},
    largeMover: {},
    market: {},
    modularDrawer: {},
    nft: {},
    notifications: {},
    postOnboarding: {},
    protect: {},
    ratings: {},
    settings: {},
    swap: {},
    toasts: {},
    walletconnect: {},
    walletSync: {},
  }) as unknown as State;

describe("Mobile WalletSyncProvider", () => {
  let store: ReturnType<typeof configureStore>;
  let mockState: State;

  beforeEach(() => {
    mockState = createMockMobileState();
    // Create a simplified mock store that matches the expected types
    store = configureStore({
      reducer: (state: State | undefined = mockState): State => state,
      preloadedState: mockState,
    });
  });

  const createWrapper = (children: React.ReactNode) => (
    <Provider store={store}>
      <WalletSyncProvider>{children}</WalletSyncProvider>
    </Provider>
  );

  describe("useMobileWalletSyncBridge", () => {
    it("should create mobile wallet sync bridge with correct state", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => {
          const bridge = useMobileWalletSyncBridge();
          return {
            bridge,
            state: bridge.useWalletSyncState(),
            trustchain: bridge.useTrustchain(),
            credentials: bridge.useMemberCredentials(),
            getAccounts: bridge.getAccounts,
            saveUpdate: bridge.saveUpdate,
            getLocalState: bridge.getLocalState,
          };
        },
        { wrapper },
      );

      expect(result.current.bridge).toBeDefined();
      expect(result.current.state).toEqual(mockWSState);
      expect(result.current.trustchain).toEqual(mockTrustchain);
      expect(result.current.credentials).toEqual(mockMemberCredentials);
      expect(typeof result.current.getAccounts).toBe("function");
      expect(typeof result.current.saveUpdate).toBe("function");
      expect(typeof result.current.getLocalState).toBe("function");
    });

    it("should return mobile accounts from getAccounts", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      const accounts = result.current.getAccounts();

      expect(accounts).toEqual([mockEthAccount, mockPolygonAccount, mockBtcAccount]);
    });

    it("should extract local state correctly from mobile format", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      const localState = result.current.getLocalState();

      expect(localState).toEqual({
        accounts: {
          list: [mockEthAccount, mockPolygonAccount, mockBtcAccount], // Should extract from mobile format correctly
          nonImportedAccountInfos: [
            {
              id: "non-imported-mobile-1",
              attempts: 1,
              attemptsLastTimestamp: Date.now(),
              error: {
                name: "ImportError",
                message: "Failed to import account",
              },
            },
          ],
        },
        accountNames: new Map([
          [mockEthAccount.id, "Mobile Ethereum Account"],
          [mockPolygonAccount.id, "Mobile Polygon Account"],
          [mockBtcAccount.id, "Mobile Bitcoin Account"],
        ]),
      });
    });

    it("should handle saveUpdate correctly", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      const distantData = null;
      const version = 6;
      const newLocalState = {
        accounts: {
          list: [mockEthAccount, mockPolygonAccount, mockBtcAccount],
          nonImportedAccountInfos: [],
        },
        accountNames: new Map([
          [mockEthAccount.id, "Updated Mobile Ethereum Account"],
          [mockPolygonAccount.id, "Updated Mobile Polygon Account"],
          [mockBtcAccount.id, "Updated Mobile Bitcoin Account"],
        ]),
      };

      // Mock dispatch function
      const mockDispatch = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      jest.spyOn(require("react-redux"), "useDispatch").mockReturnValue(mockDispatch);

      // Re-render with mocked dispatch
      const { result: resultWithMock } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      await act(async () => {
        await resultWithMock.current.saveUpdate(distantData, version, newLocalState);
      });

      // Verify that the correct actions were dispatched
      expect(mockDispatch).toHaveBeenCalledTimes(4);
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "WALLET_SYNC_UPDATE",
          payload: { data: distantData, version },
        }),
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "BULK_SET_ACCOUNT_NAMES",
          payload: { accountNames: newLocalState.accountNames },
        }),
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SET_NON_IMPORTED_ACCOUNTS",
          payload: newLocalState.accounts.nonImportedAccountInfos,
        }),
      );

      // Note: Mobile uses SET_ACCOUNTS instead of DB:REPLACE_ACCOUNTS
      const lastCall = mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1][0];
      expect(lastCall.type).toBe("SET_ACCOUNTS");
      expect(Array.isArray(lastCall.payload)).toBe(true);
      expect(lastCall.payload.length).toBe(3);
    });
  });

  describe("WalletSyncProvider Integration", () => {
    it("should render with mobile bridge", () => {
      const TestComponent = () => {
        const bridge = useMobileWalletSyncBridge();
        return <span>Bridge exists: {bridge ? "true" : "false"}</span>;
      };

      const { root } = render(createWrapper(<TestComponent />));

      // Verify component renders without errors
      expect(root).toBeDefined();
    });

    it("should provide working bridge context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => {
          const bridge = useMobileWalletSyncBridge();
          return {
            bridge,
            state: bridge.useWalletSyncState(),
            trustchain: bridge.useTrustchain(),
            credentials: bridge.useMemberCredentials(),
          };
        },
        { wrapper },
      );

      // For mobile testing, verify the bridge is working
      expect(result.current.bridge).toBeDefined();
      expect(result.current.state).toEqual(mockWSState);
      expect(result.current.trustchain).toEqual(mockTrustchain);
      expect(result.current.credentials).toEqual(mockMemberCredentials);
    });
  });

  describe("Hook Re-exports", () => {
    it("should provide wallet sync state through re-exported hooks", () => {
      // Mock the imported hooks from the library to return the expected values
      const {
        useWalletSyncState: mockUseWalletSyncState,
        useWalletSyncTrustchain: mockUseWalletSyncTrustchain,
        useWalletSyncMemberCredentials: mockUseWalletSyncMemberCredentials,
        // eslint-disable-next-line @typescript-eslint/no-var-requires
      } = require("@ledgerhq/live-wallet-sync-react");

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (mockUseWalletSyncState as jest.Mock).mockReturnValue(mockWSState);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (mockUseWalletSyncTrustchain as jest.Mock).mockReturnValue(mockTrustchain);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (mockUseWalletSyncMemberCredentials as jest.Mock).mockReturnValue(mockMemberCredentials);

      let capturedValues: {
        version: number | undefined | null;
        rootId: string | undefined | null;
        pubkey: string | undefined | null;
      } = {
        version: null,
        rootId: null,
        pubkey: null,
      };
      const TestComponent = () => {
        const walletSyncState = useWalletSyncState();
        const trustchain = useWalletSyncTrustchain();
        const memberCredentials = useWalletSyncMemberCredentials();

        capturedValues = {
          version: walletSyncState?.version,
          rootId: trustchain?.rootId,
          pubkey: memberCredentials?.pubkey,
        };

        return <div>Hooks working</div>;
      };

      render(createWrapper(<TestComponent />));

      // Verify the hooks returned the expected values
      expect(capturedValues.version).toBe(5);
      expect(capturedValues.rootId).toBe("mobile-root-id");
      expect(capturedValues.pubkey).toBe("mobile-pub-key");
    });
  });

  describe("Mobile-specific Account Handling", () => {
    it("should correctly handle mobile account structure difference", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      // Mobile bridge should extract accounts from { active: Account[] } structure
      const accounts = result.current.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts).toEqual([mockEthAccount, mockPolygonAccount, mockBtcAccount]);

      // Local state should have the flattened account list
      const localState = result.current.getLocalState();
      expect(localState.accounts.list).toEqual([
        mockEthAccount,
        mockPolygonAccount,
        mockBtcAccount,
      ]);
    });

    it("should handle empty mobile accounts structure", () => {
      const stateWithoutAccounts = {
        ...mockState,
        accounts: { active: [] },
      };

      const storeWithoutAccounts = configureStore({
        reducer: (state: State | undefined = stateWithoutAccounts): State => state,
        preloadedState: stateWithoutAccounts,
      });

      const wrapperWithoutAccounts = ({ children }: { children: React.ReactNode }) => (
        <Provider store={storeWithoutAccounts}>{children}</Provider>
      );

      const { result } = renderHook(() => useMobileWalletSyncBridge(), {
        wrapper: wrapperWithoutAccounts,
      });

      const accounts = result.current.getAccounts();
      const localState = result.current.getLocalState();

      expect(accounts).toEqual([]);
      expect(localState.accounts.list).toEqual([]);
      expect(Array.isArray(localState.accounts.list)).toBe(true);
    });
  });

  describe("Cross-platform Compatibility", () => {
    it("should provide accounts through bridge interface", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      const accounts = result.current.getAccounts();

      expect(accounts).toEqual([mockEthAccount, mockPolygonAccount, mockBtcAccount]);
      expect(Array.isArray(accounts)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle null trustchain gracefully", () => {
      const stateWithoutTrustchain = {
        ...mockState,
        trustchain: { trustchain: null, memberCredentials: null },
      };

      const storeWithoutTrustchain = configureStore({
        reducer: (state: State | undefined = stateWithoutTrustchain): State => state,
        preloadedState: stateWithoutTrustchain,
      });

      const wrapperWithoutTrustchain = ({ children }: { children: React.ReactNode }) => (
        <Provider store={storeWithoutTrustchain}>{children}</Provider>
      );

      const { result: testResult } = renderHook(
        () => {
          const bridge = useMobileWalletSyncBridge();
          return {
            trustchain: bridge.useTrustchain(),
            credentials: bridge.useMemberCredentials(),
            state: bridge.useWalletSyncState(),
          };
        },
        { wrapper: wrapperWithoutTrustchain },
      );

      expect(testResult.current.trustchain).toBeNull();
      expect(testResult.current.credentials).toBeNull();
      expect(testResult.current.state).toEqual(mockWSState);
    });
  });

  describe("Memoization", () => {
    it("should memoize bridge object to avoid unnecessary re-renders", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result, rerender } = renderHook(() => useMobileWalletSyncBridge(), { wrapper });

      const firstBridge = result.current;

      // Rerender without state changes
      rerender({});

      const secondBridge = result.current;

      // Should be the same object due to useMemo
      expect(Object.is(firstBridge, secondBridge)).toBe(true);
    });
  });
});
