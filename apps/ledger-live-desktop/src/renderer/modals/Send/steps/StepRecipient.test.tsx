import React from "react";
import { render, screen } from "tests/testSetup";
import { TFunction } from "i18next";
import type { SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useLLDCoinFamily } from "~/renderer/families";
import StepRecipient from "./StepRecipient";

jest.mock("~/renderer/families");
const mockUseAccountBridgeOrNull = jest.fn(() => ({
  getStuckAccountAndOperation: () => undefined,
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridgeOrNull: () => mockUseAccountBridgeOrNull(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockTFunction: jest.Mock<TFunction> = jest.fn(key => key) as unknown as jest.Mock<TFunction>;
const mockUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const solanaAccount = genAccount("solana-1", {
  currency: getCryptoCurrencyById("solana"),
});

const splToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("solana/spl/fake"),
  contractAddress: "FakeMint1111111111111111111111111111111111",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("solana"),
  tokenType: "spl",
  name: "Fake",
  ticker: "FAKE",
  units: [{ name: "Fake", code: "FAKE", magnitude: 8 }],
  delisted: false,
  disableCountervalue: false,
};

const makeSplTokenAccount = (extensions: SolanaTokenAccount["extensions"]): SolanaTokenAccount => ({
  ...genTokenAccount(0, solanaAccount, splToken),
  extensions,
});

describe("StepRecipient", () => {
  const baseParams = {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    t: mockTFunction as unknown as TFunction<"translation", undefined>,
    transitionTo: () => {},
    openedFromAccount: true,
    device: null,
    parentAccount: null,
    account: solanaAccount,
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
        parentAccount={solanaAccount}
        account={makeSplTokenAccount({ [extension]: {} })}
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
        parentAccount={solanaAccount}
        account={makeSplTokenAccount({})}
      />,
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toBeNull();
  });

  it("renders DefaultStepRecipient when the coin family has no SendStepRecipient", () => {
    mockUseLLDCoinFamily.mockReturnValue({} as never);

    render(<StepRecipient {...baseParams} />);

    expect(screen.queryByText("send.steps.details.selectAccountDebit")).toBeInTheDocument();
  });

  it("renders the family-specific SendStepRecipient when the coin family provides one", () => {
    const SendStepRecipient = jest.fn(() => <div data-testid="family-send-step" />);
    mockUseLLDCoinFamily.mockReturnValue({ SendStepRecipient } as never);

    render(<StepRecipient {...baseParams} />);

    expect(screen.queryByTestId("family-send-step")).toBeInTheDocument();
  });

  it("renders without crashing when useAccountBridgeOrNull returns null", () => {
    mockUseAccountBridgeOrNull.mockReturnValueOnce(null as never);
    mockUseLLDCoinFamily.mockReturnValue({} as never);

    render(<StepRecipient {...baseParams} />);

    expect(screen.queryByText("send.steps.details.selectAccountDebit")).toBeInTheDocument();
  });
});
