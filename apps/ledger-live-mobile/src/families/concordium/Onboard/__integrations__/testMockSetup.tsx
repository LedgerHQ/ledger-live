/* eslint-disable i18next/no-literal-string */
import React from "react";
import { View } from "react-native";
import {
  WC_RAW_URI,
  TEST_PUBLIC_KEY,
  TEST_SIGNATURE,
  TEST_SERIALIZED_CDT,
  COIN_CONFIG,
  currency,
  creatableAccount,
  createSession,
} from "./testUtils";

// ── Deferred promise utility ──

export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── WalletConnect mock ──

export const mockInitiatePairing = jest.fn();
export const mockGetSession = jest.fn();
export const mockRequestCreateAccount = jest.fn();
export const mockDisconnectAllSessions = jest.fn();

let mockWalletConnect: unknown = null;

class MockConcordiumWalletConnect {
  initiatePairing = (...args: unknown[]) => mockInitiatePairing(...args);
  getSession = (...args: unknown[]) => mockGetSession(...args);
  requestCreateAccount = (...args: unknown[]) => mockRequestCreateAccount(...args);
  disconnectAllSessions = () => mockDisconnectAllSessions();
}

export const walletConnectModule = {
  __esModule: true,
  ConcordiumWalletConnect: MockConcordiumWalletConnect,
  setWalletConnect: () => {
    mockWalletConnect = mockWalletConnect || new MockConcordiumWalletConnect();
    return mockWalletConnect;
  },
  getWalletConnect: () => mockWalletConnect,
  clearWalletConnect: () => {
    mockWalletConnect = null;
  },
};

// ── Signer mock ──

export const mockGetPublicKey = jest.fn();
export const mockSignCredentialDeployment = jest.fn();

export const signerModule = {
  __esModule: true,
  default: jest.fn(() => jest.fn()),
  getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args),
  signCredentialDeployment: (...args: unknown[]) => mockSignCredentialDeployment(...args),
};

// ── Bridge mock factory ──

export function createBridgeModule() {
  const { createBridges } = jest.requireActual("@ledgerhq/coin-concordium/bridge/index");
  const { currencyBridge } = createBridges(jest.fn(), COIN_CONFIG);
  return { getCurrencyBridge: () => currencyBridge };
}

// ── QR code mock ──

export function MockQRCode({ value }: { value: string }) {
  return <View testID={`qr-code-${value}`} />;
}

// ── Navigation mock ──

export const mockParentNavigate = jest.fn();

export function createNavigationModule() {
  return {
    ...jest.requireActual("@react-navigation/native"),
    useNavigation: () => ({
      goBack: jest.fn(),
      getParent: () => ({
        goBack: jest.fn(),
        navigate: mockParentNavigate,
      }),
    }),
    useRoute: () => ({
      params: {
        currency,
        accountsToAdd: [creatableAccount],
      },
    }),
  };
}

// ── Setup helpers ──

const ID_APP_SUCCESS_RESPONSE = {
  status: "success" as const,
  message: {
    serializedCredentialDeploymentTransaction: TEST_SERIALIZED_CDT,
    identityIndex: 0,
    credNumber: 0,
    accountAddress: "completed_address",
  },
};

export function setupSuccessfulPairing() {
  const session = createSession();
  const approval = createDeferred<typeof session>();

  mockInitiatePairing.mockResolvedValue({
    uri: WC_RAW_URI,
    approval: jest.fn(() => approval.promise),
  });
  mockGetSession.mockResolvedValue(session);

  return { resolveApproval: () => approval.resolve(session) };
}

export function setupSuccessfulAccountCreation() {
  const accountCreation = createDeferred<typeof ID_APP_SUCCESS_RESPONSE>();
  const signing = createDeferred<string>();

  mockGetPublicKey.mockResolvedValue(TEST_PUBLIC_KEY);
  mockRequestCreateAccount.mockImplementation(() => accountCreation.promise);
  mockSignCredentialDeployment.mockImplementation(() => signing.promise);

  return {
    resolveAccountCreation: () => accountCreation.resolve(ID_APP_SUCCESS_RESPONSE),
    resolveSigning: () => signing.resolve(TEST_SIGNATURE),
  };
}
