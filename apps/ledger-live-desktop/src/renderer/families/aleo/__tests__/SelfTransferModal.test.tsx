import React from "react";
import BigNumber from "bignumber.js";
import { ReplaySubject, Subject } from "rxjs";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import { AleoCustomModal } from "../constants";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import { mockSignedOperation, mockBroadcastedOperation } from "../__mocks__/signedOperation.mock";
import SelfTransferModal from "../SelfTransferModal";

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
let signSubject: ReplaySubject<SignOperationEvent>;

const prepareTransactionSpy = jest.fn(
  async (_account: unknown, transaction: AleoTransaction) => transaction,
);

const mockAccountBridge = {
  createTransaction: (): AleoTransaction => makeAleoTransaction(),
  updateTransaction: (tx: AleoTransaction, patch: Partial<AleoTransaction>): AleoTransaction =>
    ({ ...tx, ...patch }) as AleoTransaction,
  prepareTransaction: prepareTransactionSpy,
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
  prepareTransactionSpy.mockClear();

  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);
});

afterEach(() => {
  syncSubject.complete();
  signSubject.complete();
  document.getElementById("modals")?.remove();
});

const openedModalState = (account: Account | null = ALEO_MAIN_ACCOUNT) => ({
  settings: AFTER_ONBOARDING_STATE,
  // Body.tsx falls back to accounts[0] when params.account is null (e.g. deeplink open before
  // any account is selected) — required for Body's `invariant(account, ...)` to pass even when
  // this test deliberately opens the modal with no account.
  accounts: [ALEO_MAIN_ACCOUNT],
  modals: {
    [AleoCustomModal.SELF_TRANSFER]: {
      isOpened: true,
      data: { account, parentAccount: null },
    },
  },
});

function getContinueButton() {
  return screen.getByRole("button", { name: "Continue" });
}

async function clickContinueWhenEnabled() {
  const continueButton = getContinueButton();
  await waitFor(() => expect(continueButton).not.toBeDisabled());
  await userEvent.click(continueButton);
}

async function continueFromAmount() {
  await screen.findByTestId("aleo-step-amount");
  await clickContinueWhenEnabled();
}

async function signSuccessfully() {
  await act(async () => {
    signSubject.next({ type: "signed", signedOperation: mockSignedOperation });
  });
}

describe("SelfTransferModal", () => {
  it("renders the self transfer modal with a CONVERT_PUBLIC_TO_PRIVATE transaction by default", async () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState() });

    expect(screen.getByText("Self transfer")).toBeInTheDocument();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());
    const [, transaction] = prepareTransactionSpy.mock.calls[0];
    expect(transaction).toEqual(
      expect.objectContaining({
        recipient: ALEO_MAIN_ACCOUNT.freshAddress,
        mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
      }),
    );
  });

  it("uses an empty string as the default recipient when no account is provided", async () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState(null) });

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());
    const [, transaction] = prepareTransactionSpy.mock.calls[0];
    expect(transaction.recipient).toBe("");
  });

  it("walks the CONVERT_PUBLIC_TO_PRIVATE conversion flow through to confirmation", async () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState() });

    await clickContinueWhenEnabled();
    await continueFromAmount();
    await clickContinueWhenEnabled(); // summary
    await signSuccessfully();

    // broadcast() is wrapped in execAndWaitAtLeast(3000, ...) (see useBroadcast.ts),
    // so the confirmation screen only appears after that minimum delay.
    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("toggling to the private balance switches to CONVERT_PRIVATE_TO_PUBLIC and requires the mandatory private sync", async () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState() });

    await userEvent.click(await screen.findByText("Private balance"));

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());
    const lastCall = prepareTransactionSpy.mock.calls.at(-1);
    expect(lastCall?.[1]).toEqual(
      expect.objectContaining({ mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC }),
    );

    // Converting private funds back to public requires spending private records, so —
    // unlike CONVERT_PUBLIC_TO_PRIVATE above — this direction must go through the
    // mandatory private-sync gate rather than straight to the amount step.
    await clickContinueWhenEnabled();

    expect(await screen.findByText(/Syncing your private balance/i)).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();
  });
});
