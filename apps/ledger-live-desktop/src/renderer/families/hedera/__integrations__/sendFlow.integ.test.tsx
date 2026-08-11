import React from "react";
import BigNumber from "bignumber.js";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import SendModal from "~/renderer/modals/Send/index";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";
import { HEDERA_RECIPIENT_ADDRESS } from "../__mocks__/transaction.mock";
import { mockSignedOperation } from "../__mocks__/signedOperation.mock";
import {
  subjectRefs,
  getTransactionStatusSpy,
  prepareTransactionSpy,
} from "../__mocks__/bridge.mock";
import {
  createModalsContainer,
  setupHederaModalTest,
  cleanupHederaModalTest,
} from "../__mocks__/flowHelpers";

jest.mock("@ledgerhq/live-common/account/recentAddresses", () => ({
  getRecentAddressesStore: () => ({ addAddress: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => {
    const { mockAppState, mockDevice } = require("../__mocks__/bridge.mock");
    return {
      useHook: () => mockAppState,
      mapResult: () => ({ device: mockDevice }),
    };
  },
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => require("../__mocks__/bridge.mock").resolvedAccountBridge,
  getCurrencyBridge: () => require("../__mocks__/bridge.mock").resolvedCurrencyBridge,
}));

const defaultStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(100_000),
  amount: new BigNumber(1_000_000),
  totalSpent: new BigNumber(1_100_000),
};
beforeEach(async () => {
  await setupHederaModalTest(defaultStatus);
  prepareTransactionSpy.mockClear();
});

afterEach(() => {
  cleanupHederaModalTest();
});

function setupModal() {
  createModalsContainer();

  return render(<SendModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_SEND: {
          isOpened: true,
          data: { account: HEDERA_ACCOUNT_1, parentAccount: null },
        },
      },
    },
  });
}

function getContinueButton() {
  return screen.getByRole("button", { name: "Continue" });
}

async function clickContinueWhenEnabled() {
  await waitFor(() => expect(getContinueButton()).not.toBeDisabled());
  await userEvent.click(getContinueButton());
}

async function fillRecipientAndContinue(recipient = HEDERA_RECIPIENT_ADDRESS) {
  const input = await screen.findByTestId("send-recipient-input");
  await userEvent.type(input, recipient);
  await clickContinueWhenEnabled();
}

async function signSuccessfully() {
  await act(async () => {
    subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
  });
}

describe("Hedera send flow — full modal", () => {
  it("completes the full happy path: recipient → amount → summary → sign → success", async () => {
    setupModal();

    await fillRecipientAndContinue();
    await clickContinueWhenEnabled(); // amount step
    await clickContinueWhenEnabled(); // summary
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeVisible(), {
      timeout: 5000,
    });
  }, 20_000);

  it("carries the typed memo through to the prepared transaction", async () => {
    setupModal();

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await userEvent.type(recipientInput, HEDERA_RECIPIENT_ADDRESS);

    const memoInput = await screen.findByPlaceholderText(/Enter Tag \/ Memo/i);
    await userEvent.type(memoInput, "ref-42");

    await waitFor(() => {
      const lastTx = prepareTransactionSpy.mock.calls.at(-1)?.[1];
      expect(lastTx).toMatchObject({ memo: "ref-42" });
    });
  });

  it("disables Continue in the recipient step when missingAssociation warning is present", async () => {
    getTransactionStatusSpy.mockResolvedValue({
      ...defaultStatus,
      warnings: { missingAssociation: new Error("MissingAssociation") },
    });

    setupModal();

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await userEvent.type(recipientInput, HEDERA_RECIPIENT_ADDRESS);

    await waitFor(() => expect(getTransactionStatusSpy).toHaveBeenCalled());
    expect(getContinueButton()).toBeDisabled();
  });

  it("disables Continue in the recipient step when unverifiedAssociation warning is present", async () => {
    getTransactionStatusSpy.mockResolvedValue({
      ...defaultStatus,
      warnings: { unverifiedAssociation: new Error("UnverifiedAssociation") },
    });

    setupModal();

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await userEvent.type(recipientInput, HEDERA_RECIPIENT_ADDRESS);

    await waitFor(() => expect(getTransactionStatusSpy).toHaveBeenCalled());
    expect(getContinueButton()).toBeDisabled();
  });

  it("shows the device error state and allows retry back to summary", async () => {
    setupModal();

    await fillRecipientAndContinue();
    await clickContinueWhenEnabled(); // amount
    await clickContinueWhenEnabled(); // summary

    await act(async () => {
      subjectRefs.sign.error(new UserRefusedOnDevice());
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeVisible());
  });
});
