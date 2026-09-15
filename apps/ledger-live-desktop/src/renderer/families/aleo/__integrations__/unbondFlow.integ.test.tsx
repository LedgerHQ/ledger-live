import React from "react";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import UnbondFlowModal from "../UnbondFlowModal";
import { ALEO_BONDED_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { mockSignedOperation } from "../__mocks__/signedOperation.mock";
import { getAleoCurrencyConfig } from "../shared/utils";
import { initSendSubjects, subjectRefs, prepareTransactionSpy } from "../__mocks__/bridge.mock";

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

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

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

beforeEach(async () => {
  mockDomMeasurements();
  await importLLDCoinFamily("aleo");
  initSendSubjects();
  prepareTransactionSpy.mockClear();
  mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);
});

afterEach(() => {
  subjectRefs.sync.complete();
  subjectRefs.sign.complete();
  document.getElementById("modals")?.remove();
});

function setupModal(account = ALEO_BONDED_ACCOUNT) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<UnbondFlowModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_ALEO_UNBOND: {
          isOpened: true,
          data: { account, parentAccount: null },
        },
      },
    },
  });
}

async function clickContinueWhenEnabled() {
  const button = () => screen.getByRole("button", { name: "Continue" });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await userEvent.click(button());
}

describe("Aleo unbond flow — full modal", () => {
  it("unbonds through amount → device → success", async () => {
    setupModal();

    expect(await screen.findByTestId("unbond-unbondable-banner")).toHaveTextContent(
      /^20,000 ALEO$/,
    );
    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
    });

    await waitFor(() => expect(screen.getByText("Unbond submitted")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 20000);

  // There is no recipient step: `unbond_public` names the account as its own on-chain
  // `staker`, so the flow seeds it from the account and prepareTransaction re-pins it.
  it("seeds the staker from the account's own fresh address", async () => {
    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction).toMatchObject({
      mode: "unbond_public",
      recipient: ALEO_BONDED_ACCOUNT.freshAddress,
    });
  });

  it("steps back to the amount from the device step", async () => {
    setupModal();

    await screen.findByTestId("unbond-unbondable-banner");
    await clickContinueWhenEnabled();
    await waitFor(() =>
      expect(screen.queryByTestId("unbond-unbondable-banner")).not.toBeInTheDocument(),
    );

    await userEvent.click(await screen.findByTestId("modal-back-button"));

    expect(await screen.findByTestId("unbond-unbondable-banner")).toBeVisible();
  });
});
