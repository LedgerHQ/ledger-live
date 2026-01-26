import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RecipientScreen } from "../";

// Mock navigation
const mockClose = jest.fn();

// Mock SendFlowContext
const mockSetRecipient = jest.fn();
const mockRecipientSearchSetValue = jest.fn();
const mockRecipientSearchClear = jest.fn();

jest.mock("../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: {
        account: {
          id: "test-account-id",
          name: "Test Account",
          freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
          balance: BigInt(1000000000000000000),
          type: "Account",
          currency: {
            id: "ethereum",
            name: "Ethereum",
            ticker: "ETH",
            type: "CryptoCurrency",
          },
        },
        parentAccount: null,
        currency: {
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
          type: "CryptoCurrency",
        },
      },
      transaction: {
        transaction: null,
        status: {},
        bridgeError: null,
        bridgePending: false,
      },
      recipient: null,
      operation: {
        optimisticOperation: null,
        transactionError: null,
        signed: false,
      },
      isLoading: false,
      flowStatus: "idle",
    },
    uiConfig: {
      hasMemo: false,
      recipientSupportsDomain: true,
      hasFeePresets: false,
      hasCustomFees: false,
      hasCoinControl: false,
    },
    recipientSearch: {
      value: "",
      setValue: mockRecipientSearchSetValue,
      clear: mockRecipientSearchClear,
    },
  }),
  useSendFlowActions: () => ({
    transaction: {
      setRecipient: mockSetRecipient,
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      setAccount: jest.fn(),
    },
    operation: {
      onOperationBroadcasted: jest.fn(),
      onTransactionError: jest.fn(),
      onSigned: jest.fn(),
      onRetry: jest.fn(),
    },
    status: {
      setStatus: jest.fn(),
      setError: jest.fn(),
      setSuccess: jest.fn(),
    },
    close: mockClose,
    setAccountAndNavigate: jest.fn(),
  }),
}));

// Mock Clipboard
jest.mock("@react-native-clipboard/clipboard", () => ({
  getString: jest.fn().mockResolvedValue(""),
}));

// Mock Redux
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: () => [],
}));

// Mock domain service
jest.mock("@ledgerhq/domain-service/hooks/index", () => ({
  useDomain: () => ({
    status: "idle",
    resolutions: [],
  }),
}));

// Mock live-common hooks
jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation", () => ({
  useBridgeRecipientValidation: () => ({
    errors: {},
    warnings: {},
    isLoading: false,
    status: null,
    cleanup: jest.fn(),
  }),
}));

jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState", () => ({
  useRecipientSearchState: () => ({
    showSearchResults: false,
    showMatchedAddress: false,
    showAddressValidationError: false,
    showEmptyState: false,
    showBridgeSenderError: false,
    showSanctionedBanner: false,
    showBridgeRecipientError: false,
    showBridgeRecipientWarning: false,
    isSanctioned: false,
    isAddressComplete: false,
    addressValidationErrorType: null,
    bridgeRecipientError: undefined,
    bridgeRecipientWarning: undefined,
    bridgeSenderError: undefined,
  }),
}));

describe("RecipientScreen Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the recipient screen with input", async () => {
    render(<RecipientScreen />);

    // Should render the input placeholder
    expect(await screen.findByPlaceholderText(/Enter address or ENS/i)).toBeVisible();
  });

  it("should render the screen header", async () => {
    render(<RecipientScreen />);

    // Screen should be visible
    expect(await screen.findByPlaceholderText(/Enter address or ENS/i)).toBeVisible();
  });
});
