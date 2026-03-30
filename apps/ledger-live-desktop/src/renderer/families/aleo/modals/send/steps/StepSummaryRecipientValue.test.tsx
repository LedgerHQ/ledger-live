import React from "react";
import { render, screen } from "@testing-library/react";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useSelector } from "LLD/hooks/redux";
import { ALEO_ACCOUNT_1, ALEO_ACCOUNT_2 } from "../../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import StepSummaryRecipientValue from "./StepSummaryRecipientValue";

jest.mock("@ledgerhq/live-common/families/aleo/utils");
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useSelector: jest.fn(),
}));
jest.mock("~/renderer/components/Box", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("~/renderer/components/AccountTagDerivationMode", () => () => (
  <div data-testid="account-tag-derivation-mode" />
));
jest.mock("~/renderer/components/CryptoCurrencyIcon", () => () => (
  <div data-testid="currency-icon" />
));
jest.mock("./StepSummaryAddressBadge", () => () => <div data-testid="recipient-badge" />);
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn((account?: { freshAddress?: string }) =>
    account?.freshAddress === ALEO_ACCOUNT_2.freshAddress ? "Recipient account" : undefined,
  ),
}));

const mockedIsSelfTransferTransaction = jest.mocked(isSelfTransferTransaction);
const mockedUseSelector = jest.mocked(useSelector);

describe("StepSummaryRecipientValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render account name and badge for self-transfer recipient", () => {
    mockedIsSelfTransferTransaction.mockReturnValue(true);
    mockedUseSelector.mockReturnValue(ALEO_ACCOUNT_2);

    render(
      <StepSummaryRecipientValue
        account={ALEO_ACCOUNT_1}
        parentAccount={undefined}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
          recipient: ALEO_ACCOUNT_2.freshAddress,
        })}
      />,
    );

    expect(screen.getByText("Recipient account")).toBeInTheDocument();
    expect(screen.getByTestId("recipient-badge")).toBeInTheDocument();
  });

  it("should render recipient address for regular transfer", () => {
    const recipient = "aleo1recipientaddress";

    mockedIsSelfTransferTransaction.mockReturnValue(false);
    mockedUseSelector.mockReturnValue(undefined);

    render(
      <StepSummaryRecipientValue
        account={ALEO_ACCOUNT_1}
        parentAccount={undefined}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
          recipient,
        })}
      />,
    );

    expect(screen.getByText(recipient)).toBeInTheDocument();
    expect(screen.queryByTestId("recipient-badge")).not.toBeInTheDocument();
  });
});
