import React from "react";
import { render, screen } from "tests/testSetup";
import StepRecipient from "./StepRecipient";
import { TFunction } from "i18next";
import { SolanaAccount, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";

const mockTFunction: jest.Mock<TFunction> = jest.fn(key => key) as unknown as jest.Mock<TFunction>;

describe("StepRecipient", () => {
  it.each([
    ["transfer fee", "transferFee"],
    ["transfer hook", "transferHook"],
  ])("displays a warning when the token embeds the %s extension", (_s, extension) => {
    render(
      <StepRecipient
        t={mockTFunction as unknown as TFunction<"translation", undefined>}
        transitionTo={() => {}}
        openedFromAccount={true}
        device={null}
        parentAccount={
          {
            type: "Account",
            currency: {},
          } as unknown as SolanaAccount
        }
        account={
          {
            type: "TokenAccount",
            extensions: {
              [extension]: {},
            },
          } as unknown as SolanaTokenAccount
        }
        transaction={null}
        status={{} as unknown as TransactionStatus}
        bridgePending={false}
        error={null}
        optimisticOperation={null}
        closeModal={() => {}}
        openModal={() => {}}
        onChangeAccount={() => {}}
        onOperationBroadcasted={() => {}}
        onRetry={() => {}}
        onTransactionError={() => {}}
        onChangeNFT={() => {}}
        onChangeTransaction={() => {}}
        onResetMaybeAmount={() => {}}
        onResetMaybeRecipient={() => {}}
        onConfirmationHandler={() => {}}
        setSigned={() => {}}
        onFailHandler={() => {}}
        signed={false}
        updateTransaction={() => {}}
        currencyName={null}
        onChangeQuantities={() => {}}
        shouldSkipAmount={false}
      />,
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toHaveTextContent(
      "You are interacting with a token that is part of the Token-2022 program, also known as Token Extensions. This token comes with specific risks. Click here to learn more.",
    );
  });

  it("does not display any warning with no problematic token extensions", () => {
    render(
      <StepRecipient
        t={mockTFunction as unknown as TFunction<"translation", undefined>}
        transitionTo={() => {}}
        openedFromAccount={true}
        device={null}
        parentAccount={
          {
            type: "Account",
            currency: {},
          } as unknown as SolanaAccount
        }
        account={
          {
            type: "TokenAccount",
            extensions: {},
          } as unknown as SolanaTokenAccount
        }
        transaction={null}
        status={{} as unknown as TransactionStatus}
        bridgePending={false}
        error={null}
        optimisticOperation={null}
        closeModal={() => {}}
        openModal={() => {}}
        onChangeAccount={() => {}}
        onOperationBroadcasted={() => {}}
        onRetry={() => {}}
        onTransactionError={() => {}}
        onChangeNFT={() => {}}
        onChangeTransaction={() => {}}
        onResetMaybeAmount={() => {}}
        onResetMaybeRecipient={() => {}}
        onConfirmationHandler={() => {}}
        setSigned={() => {}}
        onFailHandler={() => {}}
        signed={false}
        updateTransaction={() => {}}
        currencyName={null}
        onChangeQuantities={() => {}}
        shouldSkipAmount={false}
      />,
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toBeNull();
  });
});
