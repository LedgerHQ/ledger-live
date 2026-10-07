/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { FamilyBalanceTypeSync } from "../FamilyBalanceTypeSync";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const mockOnComplete = jest.fn();

const account = { id: "acc-1", type: "Account", currency: { family: "aleo" } };
const transaction = { family: "aleo", mode: "transfer_private" };

function mockState() {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: { account, parentAccount: null },
      transaction: { transaction },
    },
  } as never);
}

function renderSync() {
  return render(<FamilyBalanceTypeSync onComplete={mockOnComplete} />);
}

beforeEach(() => jest.clearAllMocks());

describe("FamilyBalanceTypeSync", () => {
  it("renders the family SendBalanceTypeSync with the flow's account and transaction", () => {
    mockState();
    const SendBalanceTypeSync = jest.fn(() => <div data-testid="balance-type-sync" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendBalanceTypeSync } as never);

    renderSync();

    expect(screen.getByTestId("balance-type-sync")).toBeVisible();
    expect(SendBalanceTypeSync).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        transaction,
        onComplete: mockOnComplete,
      }),
      undefined,
    );
  });

  it("renders nothing when the family declares no SendBalanceTypeSync", () => {
    mockState();
    mockedUseLLDCoinFamily.mockReturnValue({} as never);

    const { container } = renderSync();

    expect(container).toBeEmptyDOMElement();
  });
});
