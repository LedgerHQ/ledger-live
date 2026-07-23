import React from "react";
import BigNumber from "bignumber.js";
import { ReplaySubject, Subject } from "rxjs";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import SendModal from "~/renderer/modals/Send/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { makeAleoTransaction, ALEO_RECIPIENT_ADDRESS } from "../__mocks__/transaction.mock";
import { mockSignedOperation, mockBroadcastedOperation } from "../__mocks__/signedOperation.mock";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(),
}));

// Body.tsx's onOperationBroadcasted reads the recent-addresses store, which is only
// initialized by the real app's bootstrap sequence (setupRecentAddressesStore), never in tests.
// Mocked at its own (non-barrel) module path so this doesn't pull in the actual
// @ledgerhq/live-common/account/index barrel, which has a known circular-init issue
// under jest.requireActual (see the stale lib-es build artifacts pitfall).
jest.mock("@ledgerhq/live-common/account/recentAddresses", () => ({
  getRecentAddressesStore: () => ({ addAddress: jest.fn() }),
}));

const mockDevice = { modelId: "stax", deviceId: "test-device-id", wired: false } as const;

// Only the app-connection action is mocked (device already connected, app already open).
// hw/actions/transaction.ts is intentionally left real: it derives signedOperation /
// transactionSignError itself from bridge.signOperation, which we drive via signSubject below.
const mockAppState = { device: mockDevice, opened: true, isLocked: false };

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => mockAppState,
    mapResult: () => ({ device: mockDevice }),
  }),
}));

let syncSubject: Subject<(acc: Account) => Account>;
// ReplaySubject: the transaction-signing effect subscribes asynchronously (after an
// `await getAccountBridge(...)`), so a plain Subject risks losing an emission that
// happens before the subscription is established.
let signSubject: ReplaySubject<SignOperationEvent>;

const mockAccountBridge = {
  createTransaction: (): AleoTransaction => makeAleoTransaction(),
  updateTransaction: (tx: AleoTransaction, patch: Partial<AleoTransaction>): AleoTransaction =>
    ({ ...tx, ...patch }) as AleoTransaction,
  prepareTransaction: async (_account: unknown, transaction: AleoTransaction) => transaction,
  getTransactionStatus: async () => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1000),
    amount: new BigNumber(1_000_000),
    totalSpent: new BigNumber(1_001_000),
  }),
  sync: () => syncSubject.asObservable(),
  signOperation: () => signSubject.asObservable(),
  broadcast: async () => mockBroadcastedOperation,
  estimateMaxSpendable: async () => new BigNumber(100_000_000),
};

// React's use() fast-path reads .status/.value directly off an already-tracked thenable,
// which is what Body.tsx's useAccountBridge() relies on (see bridge/useAccountBridge.ts).
const resolvedAccountBridge = Object.assign(Promise.resolve(mockAccountBridge), {
  status: "fulfilled" as const,
  value: mockAccountBridge,
});

const mockCurrencyBridge = {
  preload: () => Promise.resolve(true),
  hydrate: () => true,
};
const resolvedCurrencyBridge = Object.assign(Promise.resolve(mockCurrencyBridge), {
  status: "fulfilled" as const,
  value: mockCurrencyBridge,
});

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => resolvedAccountBridge,
  getCurrencyBridge: () => resolvedCurrencyBridge,
}));

beforeEach(async () => {
  mockDomMeasurements();
  await importLLDCoinFamily("aleo");
  syncSubject = new Subject();
  signSubject = new ReplaySubject(1);
});

afterEach(() => {
  syncSubject.complete();
  signSubject.complete();
  document.getElementById("modals")?.remove();
});

function setup(transactionOverrides?: Partial<AleoTransaction>) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  const initialState = {
    settings: AFTER_ONBOARDING_STATE,
    modals: {
      MODAL_SEND: {
        isOpened: true,
        data: {
          account: ALEO_MAIN_ACCOUNT,
          parentAccount: null,
          ...(transactionOverrides && { transaction: makeAleoTransaction(transactionOverrides) }),
        },
      },
    },
  };

  return render(<SendModal />, { initialState });
}

function getContinueButton() {
  return screen.getByRole("button", { name: "Continue" });
}

async function clickContinueWhenEnabled() {
  const continueButton = getContinueButton();
  await waitFor(() => expect(continueButton).not.toBeDisabled());
  await userEvent.click(continueButton);
}

async function fillRecipientAndContinue(recipient = ALEO_RECIPIENT_ADDRESS) {
  const input = await screen.findByTestId("send-recipient-input");
  await userEvent.type(input, recipient);
  await clickContinueWhenEnabled();
}

async function continueFromAmount() {
  await screen.findByTestId("aleo-step-amount");
  await clickContinueWhenEnabled();
}

async function continueFromSummary() {
  await clickContinueWhenEnabled();
}

async function signSuccessfully() {
  await act(async () => {
    signSubject.next({ type: "signed", signedOperation: mockSignedOperation });
  });
}

// Emits one account-updater event on syncSubject, completing the private sync.
// With the live-common default (recordPickingStrategy: "auto"), StepMandatoryPrivateSync
// transitions straight to "amount" 500 ms after progress reaches 100.
async function completePrivateSync() {
  await act(async () => {
    syncSubject.next(acc => ({
      ...(acc as AleoAccount),
      aleoResources: {
        ...(acc as AleoAccount).aleoResources,
        lastPrivateSyncDate: new Date(),
      },
    }));
  });
}

describe("Aleo send flow (integration)", () => {
  it("sends publicly through recipient → amount → summary → device → success when private sync is not required", async () => {
    setup();

    await fillRecipientAndContinue();
    await continueFromAmount();
    await continueFromSummary();
    await signSuccessfully();

    // broadcast() is wrapped in execAndWaitAtLeast(3000, ...) (see useBroadcast.ts),
    // so the confirmation screen only appears after that minimum delay.
    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("blocks the flow at the mandatory private sync step when the private balance is selected", async () => {
    setup();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();

    expect(await screen.findByText(/Syncing your private balance/i)).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();

    // Sync never completes (syncSubject stays open) — wait longer than the 500ms transition timer to ensure we don't advance.
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();
    expect(screen.getByText(/Syncing your private balance/i)).toBeInTheDocument();
  });

  it("skips private sync and the record picker for a CONVERT_PUBLIC_TO_PRIVATE (self-transfer) transaction", async () => {
    setup({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE });

    await screen.findByRole("button", { name: "Continue" });
    await clickContinueWhenEnabled();

    await continueFromAmount();
    await continueFromSummary();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("shows the confirmation error state on a device error and returns to summary on retry", async () => {
    setup();

    await fillRecipientAndContinue();
    await continueFromAmount();
    await continueFromSummary();

    await act(async () => {
      signSubject.error(new UserRefusedOnDevice());
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument(),
    );
  });

  it("completes private sync and drives the private transfer through to confirmation", async () => {
    setup();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();
    await screen.findByText(/Syncing your private balance/i);

    await completePrivateSync();

    // With auto-picking strategy, sync completion transitions directly to amount
    // (no record-picker step) — findByTestId waits for the 500 ms useEffect timer
    await continueFromAmount();
    await continueFromSummary();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("shows the sync error UI when private sync fails", async () => {
    setup();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();
    await screen.findByText(/Syncing your private balance/i);

    await act(async () => {
      syncSubject.error(new Error("Network error"));
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());
  });
});
