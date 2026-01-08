import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import {
  CantonAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/canton/types";
import BigNumber from "bignumber.js";
import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import SendRecipientFields from "./SendRecipientFields";
import { createMockAccount } from "./__tests__/testUtils";

jest.mock("~/renderer/reducers/modals", () => ({
  closeAllModal: jest.fn(),
  openModal: jest.fn(),
  modalsStateSelector: jest.fn(() => ({})),
}));
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
jest.mock("./CommentField", () => ({
  __esModule: true,
  default: () => <div data-testid="comment-field" />,
}));
jest.mock("./ExpiryDurationField", () => ({
  __esModule: true,
  default: () => <div />,
}));

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
  const { closeAllModal, openModal } = jest.requireMock("~/renderer/reducers/modals");

  beforeEach(() => {
    jest.clearAllMocks();
    closeAllModal.mockReturnValue({ type: "modals/closeAllModal", payload: undefined });
    openModal.mockImplementation((name: string, data: unknown) => ({
      type: "modals/openModal",
      payload: { name, data },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  const defaultProps = {
    account: {
      ...createMockAccount({ xpub: "test-address" }),
      cantonResources: {
        isOnboarded: true,
        pendingTransferProposals: [],
        instrumentUtxoCounts: {
          Amulet: 5, // Below warning threshold
        },
        publicKey: "test-public-key",
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
    render(<SendRecipientFields.component {...defaultProps} />);

    expect(closeAllModal).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
  });
});
