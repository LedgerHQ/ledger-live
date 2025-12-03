import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import {
  CantonAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/canton/types";
import BigNumber from "bignumber.js";
import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import SendRecipientFields from "../SendRecipientFields";
import { createMockAccount } from "./testUtils";

jest.mock("~/renderer/actions/modals", () => ({
  closeAllModal: jest.fn(() => ({ type: "CLOSE_ALL_MODAL" })),
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
}));
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
jest.mock("../CommentField", () => {
  return function MockCommentField() {
    return <div data-testid="comment-field" />;
  };
});

const createMockTransactionStatus = (
  overrides: Partial<TransactionStatus> = {},
): TransactionStatus => ({
  amount: new BigNumber(100),
  totalSpent: new BigNumber(101),
  estimatedFees: new BigNumber(1),
  errors: {},
  warnings: {},
  ...overrides,
});

describe("SendRecipientFields", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  const defaultProps = {
    account: {
      ...createMockAccount({ xpub: "test-address" }),
      cantonResources: {
        pendingTransferProposals: [],
        instrumentUtxoCounts: {
          Amulet: 5, // Below warning threshold
        },
      },
    } satisfies CantonAccount,
    transaction: {
      family: "canton",
      amount: new BigNumber(100),
      recipient: "recipient-address",
      fee: new BigNumber(1),
      memo: "",
      tokenId: "Amulet",
    } satisfies Transaction,
    status: createMockTransactionStatus(),
    onChange: mockOnChange,
    trackProperties: {},
    autoFocus: false,
  };

  it("should not show warning alert when no UTXO warnings", () => {
    render(<SendRecipientFields.component {...defaultProps} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should show warning alert when TooManyUtxosWarning is present", () => {
    const warningStatus = createMockTransactionStatus({
      warnings: {
        tooManyUtxos: new TooManyUtxosWarning("families.canton.tooManyUtxos.warning"),
      },
    });

    render(<SendRecipientFields.component {...defaultProps} status={warningStatus} />);

    expect(screen.getByText("families.canton.tooManyUtxos.warning")).toBeInTheDocument();
  });

  it("should open TooManyUtxosModal when TooManyUtxosCritical is present", async () => {
    const { closeAllModal, openModal } = jest.requireMock("~/renderer/actions/modals");

    const criticalStatus = createMockTransactionStatus({
      warnings: {
        tooManyUtxos: new TooManyUtxosCritical(),
      },
    });

    render(<SendRecipientFields.component {...defaultProps} status={criticalStatus} />);

    await waitFor(() => {
      expect(closeAllModal).toHaveBeenCalled();
      expect(openModal).toHaveBeenCalledWith("MODAL_CANTON_TOO_MANY_UTXOS", {
        account: defaultProps.account,
      });
    });
  });

  it("should not open modal when TooManyUtxosCritical is not present", () => {
    const { closeAllModal, openModal } = jest.requireMock("~/renderer/actions/modals");

    render(<SendRecipientFields.component {...defaultProps} />);

    expect(closeAllModal).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
  });
});
