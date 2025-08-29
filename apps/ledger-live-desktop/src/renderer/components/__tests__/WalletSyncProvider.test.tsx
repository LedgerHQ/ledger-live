import { setCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  WalletSyncBridge,
  useWalletSyncMemberCredentials,
  useWalletSyncState,
  useWalletSyncTrustchain,
} from "@ledgerhq/live-wallet-sync-react";
import { WSState, WalletState } from "@ledgerhq/live-wallet/store";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { AccountRaw } from "@ledgerhq/types-live";
import { configureStore } from "@reduxjs/toolkit";
import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { State } from "../../reducers";
import { WalletSyncProvider, useDesktopWalletSyncBridge } from "../WalletSyncProvider";

// Initialize crypto assets store for account deserialization
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStore({} as CryptoAssetsStore);

interface LocalTrustchainStore {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
}

// Mock dependencies
const mockUseWalletSyncBridgeFromLib = jest.fn();

jest.mock("@ledgerhq/live-wallet-sync-react", () => ({
  ...jest.requireActual("@ledgerhq/live-wallet-sync-react"),
  WalletSyncProvider: ({
    children,
    bridge,
  }: {
    children: React.ReactNode;
    bridge: WalletSyncBridge;
  }) => {
    // Store the bridge in context for tests
    mockUseWalletSyncBridgeFromLib.mockReturnValue(bridge);
    return <div data-testid="base-provider">{children}</div>;
  },
  useWalletSyncBridge: () => mockUseWalletSyncBridgeFromLib(),
  useWalletSyncState: jest.fn(),
  useWalletSyncTrustchain: jest.fn(),
  useWalletSyncMemberCredentials: jest.fn(),
  useWatchWalletSync: jest.fn(() => ({})), // Mock this to prevent context errors
}));

// Mock the desktop hook that uses useWatchWalletSync
jest.mock("~/newArch/features/WalletSync/hooks/useWalletSyncDesktop", () => ({
  useWalletSyncDesktop: jest.fn(() => ({})),
}));

// Mock data - using proper AccountRaw and fromAccountRaw
const mockEthAccountRaw: AccountRaw = {
  id: "js:2:ethereum:0xdesktop123:",
  seedIdentifier: "desktop-eth-seed",
  name: "Desktop Ethereum Account",
  derivationMode: "",
  index: 0,
  freshAddress: "0xdesktop123",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 18500000,
  operations: [],
  pendingOperations: [],
  currencyId: "ethereum",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "2000000000000000000", // 2 ETH
};

const mockBtcAccountRaw: AccountRaw = {
  id: "js:2:bitcoin:desktop456:",
  seedIdentifier: "desktop-btc-seed",
  name: "Desktop Bitcoin Account",
  derivationMode: "",
  index: 1,
  freshAddress: "bc1qdesktop456",
  freshAddressPath: "44'/0'/0'/0/0",
  blockHeight: 820000,
  operations: [],
  pendingOperations: [],
  currencyId: "bitcoin",
  lastSyncDate: "2025-01-01T12:00:00.000Z",
  balance: "100000000", // 1 BTC
};

const mockEthAccount = fromAccountRaw(mockEthAccountRaw);
const mockBtcAccount = fromAccountRaw(mockBtcAccountRaw);

const mockWSState: WSState = {
  version: 3,
  data: null,
};

const mockWalletState: WalletState = {
  walletSyncState: mockWSState,
  nonImportedAccountInfos: [],
  accountNames: new Map([
    [mockEthAccount.id, "Desktop Ethereum Account"],
    [mockBtcAccount.id, "Desktop Bitcoin Account"],
  ]),
  starredAccountIds: new Set([mockEthAccount.id]),
  walletSyncUserState: {
    visualPending: false,
    walletSyncError: null,
  },
};

const mockTrustchain: Trustchain = {
  rootId: "desktop-root-id",
  applicationPath: "desktop-path",
  walletSyncEncryptionKey: "desktop-key",
};

const mockMemberCredentials: MemberCredentials = {
  privatekey: "desktop-private-key",
  pubkey: "desktop-pub-key",
};

const mockTrustchainStore: LocalTrustchainStore = {
  trustchain: mockTrustchain,
  memberCredentials: mockMemberCredentials,
};

const createMockState = (): State =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    accounts: [mockEthAccount, mockBtcAccount],
    application: {},
    assetsDataApi: {},
    countervalues: {},
    devices: {},
    dynamicContent: {},
    market: {},
    modals: {},
    postOnboarding: {},
    settings: {},
    swap: {},
    trustchain: mockTrustchainStore,
    UI: {},
    wallet: mockWalletState,
    walletSync: {},
  }) as unknown as State;

describe("Desktop WalletSyncProvider", () => {
  let store: ReturnType<typeof configureStore>;
  let mockState: State;

  beforeEach(() => {
    mockState = createMockState();
    store = configureStore({
      reducer: {
        accounts: (state = mockState.accounts) => state,
        wallet: (state = mockState.wallet) => state,
        trustchain: (state = mockState.trustchain) => state,
        application: (state = mockState.application) => state,
        assetsDataApi: (state = mockState.assetsDataApi) => state,
        countervalues: (state = mockState.countervalues) => state,
        devices: (state = mockState.devices) => state,
        dynamicContent: (state = mockState.dynamicContent) => state,
        market: (state = mockState.market) => state,
        modals: (state = mockState.modals) => state,
        postOnboarding: (state = mockState.postOnboarding) => state,
        settings: (state = mockState.settings) => state,
        swap: (state = mockState.swap) => state,
        UI: (state = mockState.UI) => state,
        walletSync: (state = mockState.walletSync) => state,
      },
    });
  });

  const createWrapper = (children: React.ReactNode) => (
    <Provider store={store}>
      <WalletSyncProvider>{children}</WalletSyncProvider>
    </Provider>
  );

  describe("useDesktopWalletSyncBridge", () => {
    it("should create desktop wallet sync bridge with correct state", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => {
          const bridge = useDesktopWalletSyncBridge();
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

    it("should return desktop accounts from getAccounts", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useDesktopWalletSyncBridge(), { wrapper });

      const accounts = result.current.getAccounts();

      expect(accounts).toEqual([mockEthAccount, mockBtcAccount]);
    });

    it("should extract local state correctly from desktop format", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useDesktopWalletSyncBridge(), { wrapper });

      const localState = result.current.getLocalState();

      expect(localState).toEqual({
        accounts: {
          list: [mockEthAccount, mockBtcAccount],
          nonImportedAccountInfos: [],
        },
        accountNames: new Map([
          [mockEthAccount.id, "Desktop Ethereum Account"],
          [mockBtcAccount.id, "Desktop Bitcoin Account"],
        ]),
      });
    });

    it("should handle saveUpdate correctly", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useDesktopWalletSyncBridge(), { wrapper });

      const distantData = null;
      const version = 4;
      const newLocalState = {
        accounts: {
          list: [mockEthAccount, mockBtcAccount],
          nonImportedAccountInfos: [],
        },
        accountNames: new Map([
          [mockEthAccount.id, "Updated Desktop Ethereum Account"],
          [mockBtcAccount.id, "Updated Desktop Bitcoin Account"],
        ]),
      };

      // Mock dispatch function
      const mockDispatch = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      jest.spyOn(require("react-redux"), "useDispatch").mockReturnValue(mockDispatch);

      // Re-render with mocked dispatch
      const { result: resultWithMock } = renderHook(() => useDesktopWalletSyncBridge(), {
        wrapper,
      });

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

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DB:REPLACE_ACCOUNTS",
          payload: newLocalState.accounts.list,
        }),
      );
    });
  });

  describe("WalletSyncProvider Integration", () => {
    it("should render with desktop bridge", () => {
      render(createWrapper(<div data-testid="child">Desktop Child</div>));

      expect(screen.getByTestId("base-provider")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Desktop Child")).toBeInTheDocument();
    });

    it("should provide working bridge context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => {
          const bridge = useDesktopWalletSyncBridge();
          return {
            bridge,
            state: bridge.useWalletSyncState(),
            trustchain: bridge.useTrustchain(),
            credentials: bridge.useMemberCredentials(),
          };
        },
        { wrapper },
      );

      // For desktop testing, verify the bridge is working
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

      const TestComponent = () => {
        const walletSyncState = useWalletSyncState();
        const trustchain = useWalletSyncTrustchain();
        const memberCredentials = useWalletSyncMemberCredentials();

        return (
          <div>
            <span data-testid="version">{walletSyncState?.version}</span>
            <span data-testid="trustchain-root">{trustchain?.rootId}</span>
            <span data-testid="member-pubkey">{memberCredentials?.pubkey}</span>
          </div>
        );
      };

      render(createWrapper(<TestComponent />));

      expect(screen.getByTestId("version")).toHaveTextContent("3");
      expect(screen.getByTestId("trustchain-root")).toHaveTextContent("desktop-root-id");
      expect(screen.getByTestId("member-pubkey")).toHaveTextContent("desktop-pub-key");
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

      renderHook(() => useDesktopWalletSyncBridge(), {
        wrapper: wrapperWithoutTrustchain,
      });

      const { result: testResult } = renderHook(
        () => {
          const bridge = useDesktopWalletSyncBridge();
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

    it("should handle empty accounts array gracefully", () => {
      const emptyWalletState = {
        ...mockWalletState,
        accountNames: new Map(),
      };

      const stateWithoutAccounts = {
        ...mockState,
        accounts: [],
        wallet: emptyWalletState,
      };

      const storeWithoutAccounts = configureStore({
        reducer: {
          accounts: (state = stateWithoutAccounts.accounts) => state,
          wallet: (state = stateWithoutAccounts.wallet) => state,
          trustchain: (state = stateWithoutAccounts.trustchain) => state,
          application: (state = stateWithoutAccounts.application) => state,
          assetsDataApi: (state = stateWithoutAccounts.assetsDataApi) => state,
          countervalues: (state = stateWithoutAccounts.countervalues) => state,
          devices: (state = stateWithoutAccounts.devices) => state,
          dynamicContent: (state = stateWithoutAccounts.dynamicContent) => state,
          market: (state = stateWithoutAccounts.market) => state,
          modals: (state = stateWithoutAccounts.modals) => state,
          postOnboarding: (state = stateWithoutAccounts.postOnboarding) => state,
          settings: (state = stateWithoutAccounts.settings) => state,
          swap: (state = stateWithoutAccounts.swap) => state,
          UI: (state = stateWithoutAccounts.UI) => state,
          walletSync: (state = stateWithoutAccounts.walletSync) => state,
        },
      });

      const wrapperWithoutAccounts = ({ children }: { children: React.ReactNode }) => (
        <Provider store={storeWithoutAccounts}>{children}</Provider>
      );

      const { result } = renderHook(() => useDesktopWalletSyncBridge(), {
        wrapper: wrapperWithoutAccounts,
      });

      const localState = result.current.getLocalState();

      expect(localState.accounts.list).toEqual([]);
      expect(Array.isArray(localState.accounts.list)).toBe(true);
      expect(localState.accountNames).toEqual(new Map());
    });
  });

  describe("Memoization", () => {
    it("should memoize bridge object to avoid unnecessary re-renders", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result, rerender } = renderHook(() => useDesktopWalletSyncBridge(), { wrapper });

      const firstBridge = result.current;

      // Rerender without state changes
      rerender();

      const secondBridge = result.current;

      // Should be the same object due to useMemo
      expect(firstBridge).toBe(secondBridge);
    });
  });
});
