import React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationSummary from "./02-Summary";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
}));

import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";

const mockUpdateTransaction = jest.fn();
const mockSetTransaction = jest.fn();
const mockCreateTransaction = jest.fn();

(useBridgeTransaction as jest.Mock).mockReturnValue({
  transaction: { family: "cardano", amount: new BigNumber(0) },
  updateTransaction: mockUpdateTransaction,
  setTransaction: mockSetTransaction,
  status: { errors: {}, warnings: {}, estimatedFees: new BigNumber(0) },
});

(getAccountBridge as jest.Mock).mockReturnValue({
  createTransaction: mockCreateTransaction,
  updateTransaction: mockUpdateTransaction,
});

(useAccountBridge as jest.Mock).mockReturnValue({
  createTransaction: mockCreateTransaction,
  updateTransaction: mockUpdateTransaction,
});

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  getParent: jest.fn(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("VoteDelegationSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseAccount = {
    id: "account-id",
    type: "Account",
    currency: {
      id: "cardano",
      type: "CryptoCurrency",
      name: "Cardano",
      ticker: "ADA",
      units: [{ code: "ADA", magnitude: 6 }],
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    cardanoResources: {
      delegation: {
        status: true,
      },
    },
    spendableBalance: new BigNumber(100),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

  it("should update transaction with dRepAbstain when abstain option is selected", async () => {
    (useAccountScreen as jest.Mock).mockReturnValue({ account: baseAccount, parentAccount: undefined });

    const mockRoute = {
      params: {
        accountId: "account-id",
        option: "abstain",
        transaction: { family: "cardano", amount: new BigNumber(0) },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

    mockCreateTransaction.mockReturnValue({ family: "cardano", amount: new BigNumber(0) });
    mockUpdateTransaction.mockReturnValue({ family: "cardano", dRepAbstain: true, amount: new BigNumber(0) });

    render(<VoteDelegationSummary navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [baseAccount],
        },
      }),
    });

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ dRepAbstain: true })
      );
    });

    expect(screen.getByText("Always abstain")).toBeDefined();
  });

  it("should update transaction with dRepNoConfidence when noConfidence option is selected", async () => {
    (useAccountScreen as jest.Mock).mockReturnValue({ account: baseAccount, parentAccount: undefined });

    const mockRoute = {
      params: {
        accountId: "account-id",
        option: "noConfidence",
        transaction: { family: "cardano", amount: new BigNumber(0) },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

    mockCreateTransaction.mockReturnValue({ family: "cardano", amount: new BigNumber(0) });
    mockUpdateTransaction.mockReturnValue({ family: "cardano", dRepNoConfidence: true, amount: new BigNumber(0) });

    render(<VoteDelegationSummary navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [baseAccount],
        },
      }),
    });

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ dRepNoConfidence: true })
      );
    });

    expect(screen.getByText("Always no-confidence")).toBeDefined();
  });

  it("should update transaction with dRepHex when a DRep is chosen", async () => {
    (useAccountScreen as jest.Mock).mockReturnValue({ account: baseAccount, parentAccount: undefined });

    const mockDRep = { hex: "chosen_drep_123", meta: { givenName: "Chosen Name" } };
    const mockRoute = {
      params: {
        accountId: "account-id",
        drep: mockDRep,
        transaction: { family: "cardano", amount: new BigNumber(0) },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

    mockCreateTransaction.mockReturnValue({ family: "cardano", amount: new BigNumber(0) });
    mockUpdateTransaction.mockReturnValue({ family: "cardano", dRepHex: "chosen_drep_123", amount: new BigNumber(0) });

    render(<VoteDelegationSummary navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [baseAccount],
        },
      }),
    });

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ dRepHex: "chosen_drep_123" })
      );
    });

    expect(screen.getByText("Chosen Name")).toBeDefined();
  });
});
