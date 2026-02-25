import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { View, Text } from "react-native";
import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import {
  CantonAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/canton/types";
import BigNumber from "bignumber.js";
import SendSelectRecipient from "./SendSelectRecipient";
import {
  createMockAccount,
  createMockNavigation,
} from "./Onboard/OnboardScreen/__tests__/test-utils";
import { ScreenName } from "~/const";

const StepRecipientCustomAlert = SendSelectRecipient.StepRecipientCustomAlert;

jest.mock("./TooManyUtxosModal", () => ({
  component: function MockTooManyUtxosModal({
    isOpened,
    onClose: _onClose,
  }: {
    isOpened: boolean;
    onClose: () => void;
  }) {
    return isOpened ? (
      <View testID="too-many-utxos-modal">
        <Text>Too Many UTXOs Modal</Text>
      </View>
    ) : null;
  },
  options: {},
}));

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

jest.mock("~/components/Alert", () => {
  return function MockAlert({ children, type }: { children: React.ReactNode; type: string }) {
    return (
      <View testID={`alert-${type}`}>
        <Text>{children}</Text>
      </View>
    );
  };
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(() => createMockNavigation()),
  useRoute: jest.fn(() => ({
    name: ScreenName.SendSelectRecipient,
    params: {},
    key: "test-route-key",
    path: undefined,
  })),
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

describe("StepRecipientCustomAlert", () => {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not show warning text when no UTXO warnings", () => {
    render(<StepRecipientCustomAlert {...defaultProps} />);

    expect(screen.queryByText("canton.tooManyUtxos.warning")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("too-many-utxos-modal")).not.toBeOnTheScreen();
  });

  it("should show warning text when TooManyUtxosWarning is present", () => {
    const warningStatus = createMockTransactionStatus({
      warnings: {
        tooManyUtxos: new TooManyUtxosWarning("canton.tooManyUtxos.warning"),
      },
    });

    render(<StepRecipientCustomAlert {...defaultProps} status={warningStatus} />);

    expect(screen.getByText("canton.tooManyUtxos.warning")).toBeOnTheScreen();
    expect(screen.queryByTestId("too-many-utxos-modal")).not.toBeOnTheScreen();
  });

  it("should show TooManyUtxosModal when TooManyUtxosCritical is present", async () => {
    const criticalStatus = createMockTransactionStatus({
      warnings: {
        tooManyUtxos: new TooManyUtxosCritical(),
      },
    });

    render(<StepRecipientCustomAlert {...defaultProps} status={criticalStatus} />);

    await waitFor(() => {
      expect(screen.getByTestId("too-many-utxos-modal")).toBeOnTheScreen();
    });
  });

  it("should not show modal when TooManyUtxosCritical is not present", () => {
    render(<StepRecipientCustomAlert {...defaultProps} />);

    expect(screen.queryByTestId("too-many-utxos-modal")).not.toBeOnTheScreen();
  });
});
