import BigNumber from "bignumber.js";
import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { Text } from "react-native";
import EvmFeesStrategy from "./EvmFeesStrategy";
import type { Transaction } from "@ledgerhq/coin-evm/lib/types/transaction";
import type { AccountLike } from "@ledgerhq/types-live";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";

jest.mock("@ledgerhq/live-common/families/evm/react", () => ({
  useGasOptions: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn().mockReturnValue({
    updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn().mockReturnValue({ params: {} }),
  useNavigation: jest.fn().mockReturnValue({ navigate: jest.fn() }),
}));

jest.mock("./EvmNetworkFeesInfo", () => ({
  EvmNetworkFeeInfo: jest.fn(() => null),
}));

jest.mock("./SelectFeesStrategy", () => {
  return jest.fn(() => <Text testID="select-fees-strategy">SelectFeesStrategy</Text>);
});

const mockUseGasOptions = useGasOptions as jest.MockedFunction<typeof useGasOptions>;

const mockAccount = {
  type: "Account",
  id: "mock-account-id",
  currency: {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    units: [{ name: "eth", code: "ETH", magnitude: 18 }],
    blockAvgTime: 15,
  },
} as AccountLike;

const mockGasOptions = {
  slow: {
    maxPriorityFeePerGas: null,
    maxFeePerGas: null,
    gasPrice: BigNumber(2000000000000),
    nextBaseFee: null,
  },
  medium: {
    maxPriorityFeePerGas: null,
    maxFeePerGas: null,
    gasPrice: BigNumber(3000000000000),
    nextBaseFee: null,
  },
  fast: {
    maxPriorityFeePerGas: null,
    maxFeePerGas: null,
    gasPrice: BigNumber(4000000000000),
    nextBaseFee: null,
  },
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {},
  key: "test-route",
  name: "SendSummary",
};

describe("EvmFeesStrategy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders SelectFeesStrategy component when transaction is not sponsored", () => {
    const mockTransaction: Partial<Transaction> = {
      amount: BigNumber(1000000000000000000),
      recipient: "0x1234567890123456789012345678901234567890",
      gasLimit: BigNumber(21000),
      type: 0,
      sponsored: false,
      feesStrategy: "medium",
    };

    mockUseGasOptions.mockReturnValue([mockGasOptions, null, false]);

    render(
      <EvmFeesStrategy
        account={mockAccount}
        transaction={mockTransaction as Transaction}
        setTransaction={jest.fn()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={mockNavigation as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={mockRoute as any}
      />,
    );

    expect(screen.getByTestId("select-fees-strategy")).toBeTruthy();
  });

  it("returns null when transaction is sponsored", () => {
    const mockTransaction: Partial<Transaction> = {
      amount: BigNumber(1000000000000000000),
      recipient: "0x1234567890123456789012345678901234567890",
      gasLimit: BigNumber(21000),
      type: 0,
      sponsored: true,
      feesStrategy: "medium",
    };

    mockUseGasOptions.mockReturnValue([mockGasOptions, null, false]);

    render(
      <EvmFeesStrategy
        account={mockAccount}
        transaction={mockTransaction as Transaction}
        setTransaction={jest.fn()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={mockNavigation as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={mockRoute as any}
      />,
    );

    // When sponsored is true, the component returns null, so SelectFeesStrategy should not be rendered
    expect(screen.queryByTestId("select-fees-strategy")).toBeNull();
  });
});
