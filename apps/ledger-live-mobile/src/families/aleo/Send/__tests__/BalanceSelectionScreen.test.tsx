import React from "react";
import BigNumber from "bignumber.js";
import { Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { screen, render } from "@tests/test-renderer";
import { BalanceSelectionScreen } from "../BalanceSelectionScreen";
import { ScreenName } from "~/const";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1 } from "../../__mocks__/account.mock";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock("../../hooks/useFormatPrivateSyncDate", () => ({
  useFormatPrivateSyncDate: jest.fn(() => (date: Date) => `formatted:${date.toISOString()}`),
}));

const mockUseNavigation = jest.mocked(useNavigation);
const mockUseRoute = jest.mocked(useRoute);
const mockCreateTransaction = jest.fn(() => ({ family: "aleo" }));
const mockUpdateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({
    createTransaction: mockCreateTransaction,
    updateTransaction: mockUpdateTransaction,
  })),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({ name: "ALEO", code: "ALEO", magnitude: 6 })),
}));

jest.mock("~/components/CurrencyUnitValue", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");

  return {
    ...actual,
    Box: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock("~/components/StepHeader", () => {
  return function MockStepHeader({ title }: { title: string }) {
    return <Text testID="step-header">{title}</Text>;
  };
});

function makeNavigation() {
  return { navigate: jest.fn() };
}

function makeRoute({
  isSelfTransfer,
  account,
  parentAccount,
}: {
  isSelfTransfer: boolean;
  account: AccountLike;
  parentAccount?: Account;
}) {
  return {
    key: "aleo-balance-selection",
    name: "AleoSendBalanceSelection" as const,
    params: { account, parentAccount, isSelfTransfer },
  };
}

describe("BalanceSelectionScreen", () => {
  const mockNavigation = makeNavigation();
  const sendRoute = makeRoute({ account: ALEO_ACCOUNT_1, isSelfTransfer: false });
  const selfTransferRoute = makeRoute({ account: ALEO_ACCOUNT_1, isSelfTransfer: true });
  const tokenSendRoute = makeRoute({
    account: ALEO_TOKEN_ACCOUNT_1,
    parentAccount: ALEO_ACCOUNT_1,
    isSelfTransfer: false,
  });
  const tokenSelfTransferRoute = makeRoute({
    account: ALEO_TOKEN_ACCOUNT_1,
    parentAccount: ALEO_ACCOUNT_1,
    isSelfTransfer: true,
  });

  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    mockCreateTransaction.mockClear();
    mockUpdateTransaction.mockClear();
    mockUseNavigation.mockReturnValue(mockNavigation as never);
  });

  describe("non-self-transfer", () => {
    it("navigates to SendSelectRecipient with a public transaction by default", async () => {
      mockUseRoute.mockReturnValue(sendRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Send publicly"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.SendSelectRecipient,
        expect.objectContaining({
          accountId: ALEO_ACCOUNT_1.id,
          transaction: expect.objectContaining({ mode: "transfer_public", recipient: "" }),
        }),
      );
    });

    it("navigates to SendSelectRecipient with a private transaction when private is selected", async () => {
      mockUseRoute.mockReturnValue(sendRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Private"));
      await user.press(screen.getByText("Send privately"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.SendSelectRecipient,
        expect.objectContaining({
          accountId: ALEO_ACCOUNT_1.id,
          transaction: expect.objectContaining({ mode: "transfer_private", recipient: "" }),
        }),
      );
    });
  });

  describe("token account", () => {
    it("calls createTransaction with the token sub-account, not mainAccount", async () => {
      mockUseRoute.mockReturnValue(tokenSendRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Send publicly"));

      expect(mockCreateTransaction).toHaveBeenCalledWith(ALEO_TOKEN_ACCOUNT_1);
      expect(mockCreateTransaction).not.toHaveBeenCalledWith(ALEO_ACCOUNT_1);
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.SendSelectRecipient,
        expect.objectContaining({
          transaction: expect.objectContaining({ subAccountId: ALEO_TOKEN_ACCOUNT_1.id }),
        }),
      );
    });

    it("navigates to SendSelectRecipient with subAccountId for token private send", async () => {
      mockUseRoute.mockReturnValue(tokenSendRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Private"));
      await user.press(screen.getByText("Send privately"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.SendSelectRecipient,
        expect.objectContaining({
          transaction: expect.objectContaining({
            mode: "transfer_token_private",
            subAccountId: ALEO_TOKEN_ACCOUNT_1.id,
          }),
        }),
      );
    });

    it("navigates to AleoMandatoryPrivateSync with subAccountId for token private self-transfer", async () => {
      mockUseRoute.mockReturnValue(tokenSelfTransferRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Private"));
      await user.press(screen.getByText("Transfer from private"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.AleoMandatoryPrivateSync,
        expect.objectContaining({
          transaction: expect.objectContaining({
            mode: "convert_token_private_to_public",
            subAccountId: ALEO_TOKEN_ACCOUNT_1.id,
          }),
        }),
      );
    });
  });

  describe("private sync date", () => {
    const syncDate = new Date(2024, 0, 15, 14, 30, 0);
    const syncedAccount: AleoAccount = {
      ...(ALEO_ACCOUNT_1 as AleoAccount),
      aleoResources: {
        transparentBalance: new BigNumber(0),
        provableApi: null,
        privateBalance: null,
        unspentPrivateRecords: null,
        lastPrivateSyncDate: syncDate,
      },
    };

    it("shows the formatted private sync date in the private balance card", () => {
      mockUseRoute.mockReturnValue(
        makeRoute({ account: syncedAccount, isSelfTransfer: false }) as never,
      );
      render(<BalanceSelectionScreen />);

      expect(
        screen.getByText(`Last update: formatted:${syncDate.toISOString()}`),
      ).toBeOnTheScreen();
    });

    it("does not show a formatted date when private sync has never run", () => {
      mockUseRoute.mockReturnValue(sendRoute as never);
      render(<BalanceSelectionScreen />);

      expect(screen.queryByText(/Last update: formatted:/)).not.toBeOnTheScreen();
    });
  });

  describe("self-transfer", () => {
    it("navigates to SendAmountCoin with convert_public_to_private when public (default) is selected", async () => {
      mockUseRoute.mockReturnValue(selfTransferRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Transfer from public"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.SendAmountCoin,
        expect.objectContaining({
          accountId: ALEO_ACCOUNT_1.id,
          transaction: expect.objectContaining({
            mode: "convert_public_to_private",
            recipient: ALEO_ACCOUNT_1.freshAddress,
          }),
        }),
      );
    });

    it("navigates to AleoMandatoryPrivateSync when private is selected", async () => {
      mockUseRoute.mockReturnValue(selfTransferRoute as never);
      const { user } = render(<BalanceSelectionScreen />);

      await user.press(screen.getByText("Private"));
      await user.press(screen.getByText("Transfer from private"));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.AleoMandatoryPrivateSync,
        expect.objectContaining({
          account: ALEO_ACCOUNT_1,
          transaction: expect.objectContaining({
            mode: "convert_private_to_public",
            recipient: ALEO_ACCOUNT_1.freshAddress,
          }),
        }),
      );
    });
  });
});
