import React from "react";
import { render, screen } from "tests/testSetup";
import { getLLDCoinFamily } from "~/renderer/families";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import DefaultSendBody from "~/renderer/modals/Send/Body";
import { AleoCustomModal } from "../constants";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import SelfTransferModal from "../SelfTransferModal";

jest.mock("~/renderer/families", () => ({
  ...jest.requireActual("~/renderer/families"),
  getLLDCoinFamily: jest.fn(),
}));

jest.mock("~/renderer/modals/Send/Body", () => jest.fn(() => null));

const mockGetLLDCoinFamily = jest.mocked(getLLDCoinFamily);
const mockDefaultSendBody = jest.mocked(DefaultSendBody);

describe("SelfTransferModal", () => {
  const SendStepRecipient = jest.fn(() => <div data-testid="family-send-step" />);
  const openedModalState = {
    modals: {
      [AleoCustomModal.SELF_TRANSFER]: {
        isOpened: true,
        data: { account: ALEO_ACCOUNT_1, parentAccount: null },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLLDCoinFamily.mockReturnValue({ SendStepRecipient });

    const modalsDiv = document.createElement("div");
    modalsDiv.id = "modals";
    document.body.appendChild(modalsDiv);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("should render the modal Body", () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState });

    expect(screen.queryByTestId("self-transfer-body")).not.toBeInTheDocument();
  });

  it("should pass the account freshAddress as the default recipient", () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState });

    expect(mockDefaultSendBody.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          transaction: expect.objectContaining({
            recipient: ALEO_ACCOUNT_1.freshAddress,
          }),
        }),
      }),
    );
  });

  it("should use empty string as the default recipient when no account is provided", () => {
    const noAccountState = {
      modals: {
        [AleoCustomModal.SELF_TRANSFER]: {
          isOpened: true,
          data: { account: null, parentAccount: null },
        },
      },
    };

    render(<SelfTransferModal stepId="recipient" />, { initialState: noAccountState });

    expect(mockDefaultSendBody.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          transaction: expect.objectContaining({
            recipient: "",
          }),
        }),
      }),
    );
  });

  it("should use CONVERT_PUBLIC_TO_PRIVATE as the default transaction mode", () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState });

    expect(mockDefaultSendBody.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          transaction: expect.objectContaining({
            mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
          }),
        }),
      }),
    );
  });
});
