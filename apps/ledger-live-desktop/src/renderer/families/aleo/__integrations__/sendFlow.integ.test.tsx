import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import SendModal from "~/renderer/modals/Send/index";
import SelfTransferModal from "../SelfTransferModal";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import type { StepProps } from "~/renderer/modals/Send/types";
import StepRecipient from "../modals/send/steps/StepRecipient";
import StepRecipientFooter from "../modals/send/steps/StepRecipientFooter";
import { ALEO_MAIN_ACCOUNT, ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { makeAleoTransaction, ALEO_RECIPIENT_ADDRESS } from "../__mocks__/transaction.mock";
import { makeStepProps } from "../__mocks__/stepProps.mock";
import { mockSignedOperation } from "../__mocks__/signedOperation.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { getAleoCurrencyConfig } from "../shared/utils";
import { initSendSubjects, subjectRefs } from "../__mocks__/bridge.mock";
import SelectAccountComponent from "~/renderer/components/SelectAccount";

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/account/recentAddresses", () => ({
  getRecentAddressesStore: () => ({ addAddress: jest.fn() }),
}));

jest.mock("~/renderer/components/SelectAccount", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="select-account" />),
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

const SelectAccount = jest.mocked(SelectAccountComponent);

beforeEach(async () => {
  mockDomMeasurements();
  await importLLDCoinFamily("aleo");
  initSendSubjects();
  mockGetAleoCurrencyConfig.mockReturnValue({
    ...mockAleoCoinConfig,
    recordPickingStrategy: "auto",
  });
});

afterEach(() => {
  subjectRefs.sync.complete();
  subjectRefs.sign.complete();
  document.getElementById("modals")?.remove();
});

function setupModal(transactionOverrides?: Partial<AleoTransaction>) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<SendModal />, {
    initialState: {
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

async function fillRecipientAndContinue(recipient = ALEO_RECIPIENT_ADDRESS) {
  const input = await screen.findByTestId("send-recipient-input");
  await userEvent.type(input, recipient);
  await clickContinueWhenEnabled();
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

async function completePrivateSync() {
  await act(async () => {
    subjectRefs.sync.next(acc => ({
      ...(acc as AleoAccount),
      aleoResources: {
        ...(acc as AleoAccount).aleoResources,
        lastPrivateSyncDate: new Date(),
      },
    }));
  });
}

const RecipientFlowWrapper = ({
  initialTx = makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
  transitionTo,
  status,
}: {
  initialTx?: AleoTransaction;
  transitionTo?: jest.Mock;
  status?: StepProps["status"];
}) => {
  const [tx, setTx] = useState<AleoTransaction>(initialTx);
  const props = {
    ...makeStepProps({
      account: ALEO_MAIN_ACCOUNT,
      updateTransaction: ((updater: (t: AleoTransaction) => AleoTransaction) =>
        setTx(prev => updater(prev))) as StepProps["updateTransaction"],
      transitionTo: transitionTo ?? jest.fn(),
      ...(status && { status }),
    }),
    transaction: tx,
  } as StepProps;

  return (
    <>
      <StepRecipient {...props} />
      <StepRecipientFooter {...props} />
    </>
  );
};

const defaultComponentState = {
  settings: AFTER_ONBOARDING_STATE,
  accounts: [ALEO_MAIN_ACCOUNT],
};

function setupComponent(props?: Parameters<typeof RecipientFlowWrapper>[0]) {
  return render(<RecipientFlowWrapper {...props} />, { initialState: defaultComponentState });
}

describe("Aleo send flow — full modal", () => {
  it("sends publicly through recipient → amount → summary → device → success", async () => {
    setupModal();

    await fillRecipientAndContinue();
    await continueFromAmount();
    await clickContinueWhenEnabled();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("blocks at the mandatory private sync step when the private balance is selected", async () => {
    setupModal();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();

    expect(await screen.findByText(/Syncing your private balance/i)).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();

    await new Promise(resolve => setTimeout(resolve, 200));
    expect(screen.queryByTestId("aleo-step-amount")).not.toBeInTheDocument();
  });

  it("skips private sync for a CONVERT_PUBLIC_TO_PRIVATE (self-transfer) transaction", async () => {
    setupModal({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE });

    await screen.findByRole("button", { name: "Continue" });
    await clickContinueWhenEnabled();

    await continueFromAmount();
    await clickContinueWhenEnabled();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("drives CONVERT_PRIVATE_TO_PUBLIC self-transfer through sync gate to 'Transaction sent'", async () => {
    setupModal({ mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC });

    await screen.findByRole("button", { name: "Continue" });
    await clickContinueWhenEnabled();
    await screen.findByText(/Syncing your private balance/i);

    await completePrivateSync();
    await continueFromAmount();
    await clickContinueWhenEnabled();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("shows the error state on a device error and returns to summary on retry", async () => {
    setupModal();

    await fillRecipientAndContinue();
    await continueFromAmount();
    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.error(new UserRefusedOnDevice());
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument(),
    );
  }, 10000);

  it("completes private sync and drives the private transfer through to confirmation", async () => {
    setupModal();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();
    await screen.findByText(/Syncing your private balance/i);

    await completePrivateSync();
    await continueFromAmount();
    await clickContinueWhenEnabled();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);

  it("shows the sync error UI when private sync fails", async () => {
    setupModal();

    await userEvent.click(await screen.findByText("Private balance"));
    await clickContinueWhenEnabled();
    await screen.findByText(/Syncing your private balance/i);

    await act(async () => {
      subjectRefs.sync.error(new Error("Network error"));
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());
  });
});

describe("Aleo send flow — recipient step", () => {
  it("should disable Continue when bridgePending is true", () => {
    render(
      <StepRecipientFooter
        {...({
          ...makeStepProps({ account: ALEO_MAIN_ACCOUNT, bridgePending: true }),
          transaction: makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
        } as StepProps)}
      />,
      { initialState: { settings: AFTER_ONBOARDING_STATE } },
    );

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should disable Continue when there is a recipient error", () => {
    setupComponent({
      status: {
        errors: { recipient: new Error("Invalid address") },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      },
    });

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should disable Continue when there is a sender error", () => {
    setupComponent({
      status: {
        errors: { sender: new Error("Sender not valid") },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      },
    });

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should drop properties and switch to TRANSFER_PUBLIC when a private tx account changes", async () => {
    const privateTx = makeAleoTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: { amountRecordCommitments: ["commitment-abc"], feeRecordCommitment: null },
    });
    const updateTransaction = jest
      .fn()
      .mockImplementation((updater: (t: AleoTransaction) => AleoTransaction) => updater(privateTx));

    render(
      <StepRecipient
        {...({
          ...makeStepProps({
            account: ALEO_MAIN_ACCOUNT,
            transaction: privateTx,
            updateTransaction,
          }),
          transaction: privateTx,
        } as StepProps)}
      />,
      { initialState: defaultComponentState },
    );

    const lastCall = SelectAccount.mock.calls[SelectAccount.mock.calls.length - 1];
    const { onChange } = lastCall[0] as { onChange: (account: typeof ALEO_ACCOUNT_1) => void };

    await act(async () => {
      onChange(ALEO_ACCOUNT_1);
    });

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updatedTx = updateTransaction.mock.results[0].value as AleoTransaction;
    expect(updatedTx.mode).toBe(TRANSACTION_TYPE.TRANSFER_PUBLIC);
    expect(updatedTx.properties).toBeUndefined();
  });
});

describe("Aleo self-transfer modal — token account", () => {
  beforeEach(() => {
    mockGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      enableTokens: true,
      recordPickingStrategy: "auto",
    });
  });

  function setupTokenSelfTransferModal() {
    const modalsDiv = document.createElement("div");
    modalsDiv.id = "modals";
    document.body.appendChild(modalsDiv);

    return render(<SelfTransferModal />, {
      initialState: {
        settings: AFTER_ONBOARDING_STATE,
        accounts: [ALEO_MAIN_ACCOUNT],
        modals: {
          MODAL_ALEO_SELF_TRANSFER: {
            isOpened: true,
            data: { account: ALEO_TOKEN_ACCOUNT, parentAccount: ALEO_MAIN_ACCOUNT },
          } as never,
        },
      },
    });
  }

  it("passes withSubAccounts to SelectAccount when enableTokens is true", async () => {
    setupTokenSelfTransferModal();

    await waitFor(() => {
      const lastCall = SelectAccount.mock.calls[SelectAccount.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({ withSubAccounts: true });
    });
  });

  it("drives CONVERT_TOKEN_PUBLIC_TO_PRIVATE through to 'Transaction sent' with token account", async () => {
    setupTokenSelfTransferModal();

    await clickContinueWhenEnabled();
    await continueFromAmount();
    await clickContinueWhenEnabled();
    await signSuccessfully();

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 12000);
});
