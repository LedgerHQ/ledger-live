import React from "react";
import { render, screen } from "tests/testSetup";
import { getLLDCoinFamily } from "~/renderer/families";
import { AleoCustomModal } from "../constants";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import SelfTransferModal from "../SelfTransferModal";

jest.mock("~/renderer/families", () => ({
  ...jest.requireActual("~/renderer/families"),
  getLLDCoinFamily: jest.fn(),
}));

const mockGetLLDCoinFamily = jest.mocked(getLLDCoinFamily);

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
  });

  it("should render the modal Body", () => {
    render(<SelfTransferModal stepId="recipient" />, { initialState: openedModalState });

    expect(screen.queryByTestId("self-transfer-body")).not.toBeInTheDocument();
  });
});
