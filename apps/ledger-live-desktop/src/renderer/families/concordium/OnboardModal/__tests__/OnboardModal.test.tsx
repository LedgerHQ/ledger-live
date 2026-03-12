import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { Account } from "@ledgerhq/types-live";
import OnboardModal from "../index";
import {
  createConcordiumAccount,
  createDefaultProps,
  createInitialState,
  createMockDevice,
  defaultConcordiumResources,
  SESSION_TOPIC,
  T,
  WAIT_OPTS,
} from "./testUtils";

setSupportedCurrencies(["concordium"]);

const mockPairWalletConnect = jest.fn();
const mockOnboardAccount = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
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

const currency = getCryptoCurrencyById("concordium");
const mockDevice = createMockDevice();

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

describe("OnboardModal", () => {
  const creatableAccount = createConcordiumAccount(currency, { used: false });
  const completedAccount = createConcordiumAccount(currency, {
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

  const defaultProps = createDefaultProps(currency, creatableAccount);
  const initialState = createInitialState(mockDevice);

  beforeEach(() => {
    jest.clearAllMocks();
    const modalsRoot = document.createElement("div");
    modalsRoot.id = "modals";
    document.body.appendChild(modalsRoot);
  });

  afterEach(async () => {
    cleanup();
    document.getElementById("modals")?.remove();
    // Flush pending macrotasks so observable subscriptions unsubscribe cleanly
    await new Promise(r => setTimeout(r, 0));
  });

  it("should complete the full onboarding happy path", async () => {
    mockPairWalletConnect.mockReturnValue(createMockPairObservable());
    mockOnboardAccount.mockReturnValue(createMockOnboardObservable(completedAccount));

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    const agreeButton = await screen.findByRole("button", { name: /agree/i });
    expect(agreeButton).toBeVisible();

    await user.click(agreeButton);
    expect(mockPairWalletConnect).toHaveBeenCalledWith(currency.id, mockDevice.deviceId);

    await waitFor(() => {
      expect(screen.getByText(/scan the qr code/i)).toBeVisible();
    }, WAIT_OPTS);

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockOnboardAccount).toHaveBeenCalledWith(
      currency.id,
      mockDevice.deviceId,
      creatableAccount,
    );

    // Confirmation code is set synchronously, no transition delay needed
    await waitFor(() => {
      expect(screen.getByText(/match the code below/i)).toBeVisible();
    });
    expect(screen.getByRole("group", { name: /confirmation code/i })).toBeVisible();

    await waitFor(() => {
      expect(screen.getByText(/sign transaction on your ledger device/i)).toBeVisible();
    }, WAIT_OPTS);

    await waitFor(() => {
      expect(
        screen.getByText(/your concordium account has been created successfully/i),
      ).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

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

    // Error is set directly (no setStateWithTimeout), no transition delay
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

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

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

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to onboard new account/i)).toBeVisible();
    });

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockPairWalletConnect).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

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

    expect(mockPairWalletConnect).toHaveBeenCalledTimes(2);
  }, 15_000);

  it("should throw when currency is null", () => {
    expect(() =>
      render(
        <OnboardModal currency={null} editedNames={{}} selectedAccounts={[creatableAccount]} />,
        { initialState },
      ),
    ).toThrow();
  });

  it("should show connect device screen when no device is connected", () => {
    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        ...initialState,
        devices: { currentDevice: null, devices: [] },
      },
    });

    expect(screen.queryByRole("button", { name: /agree/i })).not.toBeInTheDocument();
  });

  it("should throw when no creatable account exists", () => {
    const importableAccount = createConcordiumAccount(currency, {
      id: "js:2:concordium:imported:concordium",
      used: true,
    });

    expect(() =>
      render(<OnboardModal {...defaultProps} selectedAccounts={[importableAccount]} />, {
        initialState,
      }),
    ).toThrow();
  });

  it("should display edited account name", async () => {
    mockPairWalletConnect.mockReturnValue(createMockPairObservable());

    const { user } = render(
      <OnboardModal {...defaultProps} editedNames={{ [creatableAccount.id]: "My Custom Name" }} />,
      { initialState },
    );

    // SectionAccounts only renders once isPairing=true
    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText("My Custom Name")).toBeVisible();
    });
  }, 10_000);
});
