import React from "react";
import { render, screen } from "tests/testSetup";
import { TFunction } from "i18next";
import { SolanaAccount, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account } from "@ledgerhq/types-live";
import { getLLDCoinFamily } from "~/renderer/families";
import StepRecipient from "./StepRecipient";

jest.mock("~/renderer/families");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockTFunction: jest.Mock<TFunction> = jest.fn(key => key) as unknown as jest.Mock<TFunction>;
const mockGetLLDCoinFamily = jest.mocked(getLLDCoinFamily);

describe("StepRecipient", () => {
  const baseParams = {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    t: mockTFunction as unknown as TFunction<"translation", undefined>,
    transitionTo: () => {},
    openedFromAccount: true,
    device: null,
    parentAccount: null,
    account: {
      type: "Account",
      currency: {},
    } as unknown as Account,
    transaction: null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    status: {} as unknown as TransactionStatus,
    bridgePending: false,
    error: null,
    optimisticOperation: null,
    closeModal: () => {},
    openModal: () => {},
    onChangeAccount: () => {},
    onOperationBroadcasted: () => {},
    onRetry: () => {},
    onTransactionError: () => {},
    onChangeTransaction: () => {},
    onResetMaybeAmount: () => {},
    onResetMaybeRecipient: () => {},
    onConfirmationHandler: () => {},
    setSigned: () => {},
    onFailHandler: () => {},
    signed: false,
    updateTransaction: () => {},
    currencyName: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["transfer fee", "transferFee"],
    ["transfer hook", "transferHook"],
  ])("displays a warning when the token embeds the %s extension", (_s, extension) => {
    render(
      <StepRecipient
        {...baseParams}
        parentAccount={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            type: "Account",
            currency: {},
          } as unknown as SolanaAccount
        }
        account={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            type: "TokenAccount",
            extensions: {
              [extension]: {},
            },
          } as unknown as SolanaTokenAccount
        }
      />,
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toHaveTextContent(
      "You are interacting with a token that is part of the Token-2022 program, also known as Token Extensions. This token comes with specific risks. Click here to learn more.",
    );
  });

  it("does not display any warning with no problematic token extensions", () => {
    render(
      <StepRecipient
        {...baseParams}
        parentAccount={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            type: "Account",
            currency: {},
          } as unknown as SolanaAccount
        }
        account={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            type: "TokenAccount",
            extensions: {},
          } as unknown as SolanaTokenAccount
        }
      />,
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toBeNull();
  });

  it("renders DefaultStepRecipient when the coin family has no SendStepRecipient", () => {
    mockGetLLDCoinFamily.mockReturnValue({});

    render(<StepRecipient {...baseParams} />);

    expect(screen.queryByText("send.steps.details.selectAccountDebit")).toBeInTheDocument();
  });

  it("renders the family-specific SendStepRecipient when the coin family provides one", () => {
    const SendStepRecipient = jest.fn(() => <div data-testid="family-send-step" />);
    mockGetLLDCoinFamily.mockReturnValue({ SendStepRecipient });

    render(<StepRecipient {...baseParams} />);

    expect(screen.queryByTestId("family-send-step")).toBeInTheDocument();
  });
});
