import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account } from "@ledgerhq/types-live";
import { ConcordiumAccount, ConcordiumResources } from "@ledgerhq/coin-concordium/types";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import BigNumber from "bignumber.js";
import OnboardModal from "../index";

// --- External boundary mocks ---

const mockPairWalletConnect = jest.fn();
const mockOnboardAccount = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => ({
    pairWalletConnect: mockPairWalletConnect,
    onboardAccount: mockOnboardAccount,
  })),
}));

jest.mock("@ledgerhq/coin-concordium/network/walletConnect", () => ({
  setWalletConnect: jest.fn(() => ({
    disconnectAllSessions: jest.fn(),
  })),
  clearWalletConnect: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

// Must return a valid Redux action so dispatch doesn't throw
jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(() => ({ type: "MOCK_ADD_ACCOUNTS" })),
}));

// Simplify Modal: remove portal/transitions, keep ModalBody real for Stepper
jest.mock("~/renderer/components/Modal", () => {
  const ModalBody = jest.requireActual("~/renderer/components/Modal/ModalBody").default;
  return {
    __esModule: true,
    default: ({
      render: renderModal,
    }: {
      render: (props: { onClose: () => void }) => React.ReactNode;
      [key: string]: unknown;
    }) => <div data-testid="modal">{renderModal({ onClose: jest.fn() })}</div>,
    ModalBody,
  };
});

// useInterval with delay=0 creates setInterval(fn, 0) — causes open handles in Jest
jest.mock("~/renderer/hooks/useInterval", () => jest.fn());

// TransactionConfirm renders Lottie device animations — not relevant to flow
jest.mock("../components/TransactionConfirm", () => ({
  TransactionConfirm: () => <div data-testid="transaction-confirm">Confirm on device</div>,
}));

// --- Helpers ---

const currency = getCryptoCurrencyById("concordium");

const mockDevice: Device = {
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
};

const defaultConcordiumResources: ConcordiumResources = {
  isOnboarded: false,
  credId: "",
  publicKey: "",
  identityIndex: 0,
  credNumber: 0,
  ipIdentity: 0,
};

function createConcordiumAccount(overrides: Partial<ConcordiumAccount> = {}): ConcordiumAccount {
  const derivationMode = "concordium" as const;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runDerivationScheme(scheme, currency, { account: 0 });

  return {
    id: "js:2:concordium:test-address:concordium",
    type: "Account",
    used: false,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "test_address",
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    seedIdentifier: "test_seed",
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
    subAccounts: [],
    concordiumResources: defaultConcordiumResources,
    ...overrides,
  };
}

// STEP_TRANSITION_TIMEOUT in OnboardModal is 1500ms.
// Each emission must be spaced > 1500ms so the previous state update
// is applied before the next emission overrides its pending timer.
const T = 1500;

const SESSION_TOPIC = "ABCDsession-topic-rest";

function createMockPairObservable() {
  return {
    subscribe: jest.fn(({ next, complete }: SubscribeArgs) => {
      const t1 = setTimeout(() => {
        next({ status: "PREPARE", walletConnectUri: "wc:mock-uri-for-testing" });
      }, 10);
      const t2 = setTimeout(() => {
        next({ status: "SUCCESS", sessionTopic: SESSION_TOPIC });
        complete();
      }, T + 200);

      return {
        unsubscribe: jest.fn(() => {
          clearTimeout(t1);
          clearTimeout(t2);
        }),
      };
    }),
  };
}

function createMockOnboardObservable(completedAccount: Account) {
  return {
    subscribe: jest.fn(({ next, complete }: SubscribeArgs) => {
      const t1 = setTimeout(() => {
        next({ status: AccountOnboardStatus.SIGN });
      }, 10);
      const t2 = setTimeout(() => {
        next({ account: completedAccount });
        complete();
      }, T + 200);

      return {
        unsubscribe: jest.fn(() => {
          clearTimeout(t1);
          clearTimeout(t2);
        }),
      };
    }),
  };
}

type SubscribeArgs = {
  next: (value: unknown) => void;
  complete: () => void;
  error: (error: Error) => void;
};

function createMockPairErrorObservable(error: Error) {
  return {
    subscribe: jest.fn(({ error: onError }: SubscribeArgs) => {
      const t1 = setTimeout(() => onError(error), 10);
      return { unsubscribe: jest.fn(() => clearTimeout(t1)) };
    }),
  };
}

function createMockOnboardErrorObservable(error: Error) {
  return {
    subscribe: jest.fn(({ error: onError }: SubscribeArgs) => {
      const t1 = setTimeout(() => onError(error), 10);
      return { unsubscribe: jest.fn(() => clearTimeout(t1)) };
    }),
  };
}

const WAIT_OPTS = { timeout: 2 * T + 500 };

// --- Test ---

describe("OnboardModal - Integration", () => {
  const creatableAccount = createConcordiumAccount({ used: false });
  const completedAccount = createConcordiumAccount({
    id: "js:2:concordium:completed-address:concordium",
    freshAddress: "completed_address",
    used: true,
    concordiumResources: {
      ...defaultConcordiumResources,
      isOnboarded: true,
      credId: "completed_cred_id",
      publicKey: "completed_public_key",
    },
  });

  // Only UserProps — connect provides device, existingAccounts, closeModal, addAccountsAction, t
  const defaultProps = {
    currency,
    editedNames: {},
    selectedAccounts: [creatableAccount],
  };

  const initialState = {
    devices: { currentDevice: mockDevice, devices: [mockDevice] },
    accounts: { active: [] },
    modals: {
      MODAL_CONCORDIUM_ONBOARD_ACCOUNT: { isOpened: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    // Flush pending macrotasks to let observable subscriptions unsubscribe cleanly
    await new Promise(r => setTimeout(r, 0));
  });

  it("should complete the full onboarding happy path", async () => {
    mockPairWalletConnect.mockReturnValue(createMockPairObservable());
    mockOnboardAccount.mockReturnValue(createMockOnboardObservable(completedAccount));

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    // Step 1: Acknowledgment screen
    const agreeButton = await screen.findByRole("button", { name: /agree/i });
    expect(agreeButton).toBeVisible();

    // Click Agree → starts pairing
    await user.click(agreeButton);
    expect(mockPairWalletConnect).toHaveBeenCalledWith(currency, mockDevice.deviceId);

    // Pairing emits PREPARE → QR code shown (after transition delay)
    await waitFor(() => {
      expect(screen.getByText(/scan the qr code/i)).toBeVisible();
    }, WAIT_OPTS);

    // Pairing emits SUCCESS → success message (after transition delay)
    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    // "Continue" button after pairing success
    const continueAfterPairing = screen.getByRole("button", { name: /continue/i });

    // Step 2: Click Continue → starts account creation
    await user.click(continueAfterPairing);
    expect(mockOnboardAccount).toHaveBeenCalledWith(
      currency,
      mockDevice.deviceId,
      creatableAccount,
    );

    // Confirmation code set synchronously → visible immediately
    await waitFor(() => {
      expect(screen.getByText(/match the code below/i)).toBeVisible();
    });
    expect(screen.getByRole("group", { name: /confirmation code/i })).toBeVisible();

    // Onboarding emits SIGN → device confirm (after transition delay)
    await waitFor(() => {
      expect(screen.getByTestId("transaction-confirm")).toBeVisible();
    }, WAIT_OPTS);

    // Onboarding emits SUCCESS → success message (after transition delay)
    await waitFor(() => {
      expect(
        screen.getByText(/your concordium account has been created successfully/i),
      ).toBeVisible();
    }, WAIT_OPTS);

    // "Continue" → adds accounts, moves to finish
    const continueAfterCreate = screen.getByRole("button", { name: /continue/i });
    await user.click(continueAfterCreate);

    // Step 3: Finish screen
    const doneButton = await screen.findByTestId("add-accounts-finish-close-button");
    expect(doneButton).toBeVisible();

    await user.click(doneButton);
  }, 20_000);

  it("should show error and Try again when pairing fails", async () => {
    mockPairWalletConnect.mockReturnValue(
      createMockPairErrorObservable(new Error("Connection failed")),
    );

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    // Error is set directly (no setStateWithTimeout), appears quickly
    await waitFor(() => {
      expect(screen.getByText(/failed to onboard new account/i)).toBeVisible();
    });

    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  }, 10_000);

  it("should show error and Try again when account creation fails", async () => {
    mockPairWalletConnect.mockReturnValue(createMockPairObservable());
    mockOnboardAccount.mockReturnValue(
      createMockOnboardErrorObservable(new Error("IDApp create_account failed")),
    );

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    // Go through pairing
    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Account creation errors
    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeVisible();
    });

    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  }, 15_000);

  it("should retry pairing after failure and complete the flow", async () => {
    mockPairWalletConnect
      .mockReturnValueOnce(createMockPairErrorObservable(new Error("Connection failed")))
      .mockReturnValueOnce(createMockPairObservable());
    mockOnboardAccount.mockReturnValue(createMockOnboardObservable(completedAccount));

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    // First attempt fails
    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to onboard new account/i)).toBeVisible();
    });

    // Click "Try again" → retries pairing
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockPairWalletConnect).toHaveBeenCalledTimes(2);

    // Second attempt succeeds
    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    // Continue through account creation to finish
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/your concordium account has been created successfully/i),
      ).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    const doneButton = await screen.findByTestId("add-accounts-finish-close-button");
    expect(doneButton).toBeVisible();
  }, 25_000);

  it("should auto-retry when pairing session expires", async () => {
    mockPairWalletConnect
      .mockReturnValueOnce(createMockPairErrorObservable(new Error("Session expired")))
      .mockReturnValueOnce(createMockPairObservable());

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    // Auto-retry is transparent — user sees success, not error
    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    // pairWalletConnect called twice: initial + auto-retry
    expect(mockPairWalletConnect).toHaveBeenCalledTimes(2);
  }, 15_000);
});
