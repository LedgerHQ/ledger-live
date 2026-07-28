import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { AleoCustomModal } from "../constants";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { mockSignedOperation } from "../__mocks__/signedOperation.mock";
import { initSendSubjects, subjectRefs, prepareTransactionSpy } from "../__mocks__/bridge.mock";
import SelfTransferModal from "../SelfTransferModal";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(),
}));

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

beforeEach(async () => {
  mockDomMeasurements();
  await importLLDCoinFamily("aleo");
  initSendSubjects();
  prepareTransactionSpy.mockClear();

  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);
});

afterEach(() => {
  subjectRefs.sync.complete();
  subjectRefs.sign.complete();
  document.getElementById("modals")?.remove();
});

const openedModalState = (account: Account | null = ALEO_MAIN_ACCOUNT) => ({
  settings: AFTER_ONBOARDING_STATE,
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
    subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
  });
}

describe("SelfTransferModal", () => {
  it("renders the self transfer modal with a CONVERT_PUBLIC_TO_PRIVATE transaction by default", async () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState() });

    expect(screen.getByText("Convert")).toBeInTheDocument();

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
    await clickContinueWhenEnabled();
    await signSuccessfully();

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

    await clickContinueWhenEnabled();

    expect(await screen.findByText(/Syncing your private balance/i)).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();
  });
});
