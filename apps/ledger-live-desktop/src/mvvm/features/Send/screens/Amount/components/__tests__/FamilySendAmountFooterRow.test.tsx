/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { FamilySendAmountFooterRow } from "../FamilySendAmountFooterRow";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const account = { id: "acc-1", type: "Account", currency: { family: "aleo" } };
const transaction = { family: "aleo", mode: "transfer_public" };

function mockState(overrides: {
  account?: unknown;
  parentAccount?: unknown;
  transaction?: unknown;
}) {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: {
        account: "account" in overrides ? overrides.account : account,
        parentAccount: overrides.parentAccount ?? null,
      },
      transaction: {
        transaction: "transaction" in overrides ? overrides.transaction : transaction,
      },
    },
  } as never);
}

beforeEach(() => jest.clearAllMocks());

describe("FamilySendAmountFooterRow", () => {
  it("renders the family SendAmountFooterRow once an account and transaction exist", () => {
    mockState({});
    const SendAmountFooterRow = jest.fn(() => <div data-testid="send-amount-footer-row" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendAmountFooterRow } as never);

    render(<FamilySendAmountFooterRow />);

    expect(screen.getByTestId("send-amount-footer-row")).toBeVisible();
    expect(SendAmountFooterRow).toHaveBeenCalledWith({ account, transaction }, undefined);
  });

  it("renders nothing when the family declares no SendAmountFooterRow", () => {
    mockState({});
    mockedUseLLDCoinFamily.mockReturnValue({} as never);

    const { container } = render(<FamilySendAmountFooterRow />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no account or transaction yet", () => {
    mockState({ account: null, transaction: null });
    const SendAmountFooterRow = jest.fn(() => <div data-testid="send-amount-footer-row" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendAmountFooterRow } as never);

    const { container } = render(<FamilySendAmountFooterRow />);

    expect(container).toBeEmptyDOMElement();
    expect(SendAmountFooterRow).not.toHaveBeenCalled();
  });
});
