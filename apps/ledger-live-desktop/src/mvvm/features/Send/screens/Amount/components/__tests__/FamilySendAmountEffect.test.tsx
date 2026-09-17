/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { FamilySendAmountEffect } from "../FamilySendAmountEffect";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const account = { id: "acc-1", type: "Account", currency: { family: "bitcoin" } };
const transaction = { family: "bitcoin", sender: "private" };

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

describe("FamilySendAmountEffect", () => {
  it("renders the family SendAmountEffect once an account and transaction exist", () => {
    mockState({});
    const SendAmountEffect = jest.fn(() => <div data-testid="send-amount-effect" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendAmountEffect } as never);

    render(<FamilySendAmountEffect />);

    expect(screen.getByTestId("send-amount-effect")).toBeVisible();
    expect(SendAmountEffect).toHaveBeenCalledWith({ account, transaction }, undefined);
  });

  it("renders nothing when the family declares no SendAmountEffect", () => {
    mockState({});
    mockedUseLLDCoinFamily.mockReturnValue({} as never);

    const { container } = render(<FamilySendAmountEffect />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no account or transaction yet", () => {
    mockState({ account: null, transaction: null });
    const SendAmountEffect = jest.fn(() => <div data-testid="send-amount-effect" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendAmountEffect } as never);

    const { container } = render(<FamilySendAmountEffect />);

    expect(container).toBeEmptyDOMElement();
    expect(SendAmountEffect).not.toHaveBeenCalled();
  });
});
