/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { FamilyBalanceTypeSync } from "../FamilyBalanceTypeSync";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
  useSendFlowActions: jest.fn(),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);

const mockUpdateAccount = jest.fn();
const mockOnComplete = jest.fn();
const mockOnCancel = jest.fn();

const account = { id: "acc-1", type: "Account", currency: { family: "aleo" } };
const transaction = { family: "aleo", mode: "transfer_private" };

type CapturedProps = {
  onComplete: () => void;
  onCancel: () => void;
  onAccountUpdated: (account: unknown) => void;
};

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

function renderSync() {
  return render(<FamilyBalanceTypeSync onComplete={mockOnComplete} onCancel={mockOnCancel} />);
}

function renderCapturingProps(): CapturedProps {
  let captured: CapturedProps | undefined;
  const SendBalanceTypeSync = jest.fn((props: CapturedProps) => {
    captured = props;
    return null;
  });
  mockedUseLLDCoinFamily.mockReturnValue({ SendBalanceTypeSync } as never);
  renderSync();
  if (!captured) throw new Error("SendBalanceTypeSync was not rendered");
  return captured;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseSendFlowActions.mockReturnValue({
    transaction: { updateAccount: mockUpdateAccount },
  } as never);
});

describe("FamilyBalanceTypeSync", () => {
  it("renders the family SendBalanceTypeSync with the flow's account and transaction", () => {
    mockState({});
    const SendBalanceTypeSync = jest.fn(() => <div data-testid="balance-type-sync" />);
    mockedUseLLDCoinFamily.mockReturnValue({ SendBalanceTypeSync } as never);

    renderSync();

    expect(screen.getByTestId("balance-type-sync")).toBeVisible();
    expect(SendBalanceTypeSync).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        transaction,
        onComplete: mockOnComplete,
        onCancel: mockOnCancel,
      }),
      undefined,
    );
  });

  it("renders nothing when the family declares no SendBalanceTypeSync", () => {
    mockState({});
    mockedUseLLDCoinFamily.mockReturnValue({} as never);

    const { container } = renderSync();

    expect(container).toBeEmptyDOMElement();
  });

  it("hands a refreshed main account to the flow", () => {
    mockState({});
    const refreshed = { ...account, balance: "refreshed" };

    renderCapturingProps().onAccountUpdated(refreshed);

    expect(mockUpdateAccount).toHaveBeenCalledWith(refreshed);
  });

  it("re-selects the token account from a refreshed parent account", () => {
    const tokenAccount = { id: "token-1", type: "TokenAccount", parentId: "acc-1" };
    mockState({ account: tokenAccount, parentAccount: account });
    const refreshedToken = { ...tokenAccount, balance: "refreshed" };
    const refreshedParent = { ...account, subAccounts: [refreshedToken] };

    renderCapturingProps().onAccountUpdated(refreshedParent);

    expect(mockUpdateAccount).toHaveBeenCalledWith(refreshedToken, refreshedParent);
  });
});
