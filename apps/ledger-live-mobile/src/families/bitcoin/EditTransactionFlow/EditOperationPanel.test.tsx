import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/core";
import { useEditTxFeatureFlag } from "~/hooks/useEditTxFeatureFlag";
import { NavigatorName, ScreenName } from "~/const";
import { EditOperationPanel } from "./EditOperationPanel";

jest.mock("~/hooks/useEditTxFeatureFlag", () => ({
  useEditTxFeatureFlag: jest.fn(),
}));

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: jest.fn(),
}));

jest.mock("~/components/EditTransaction/EditOperationPanel", () => {
  return function MockEditOperationPanel({
    onPressCta,
  }: {
    isOperationStuck: boolean;
    onPressCta: () => void;
  }) {
    return <Text onPress={onPressCta}>edit-operation-panel-cta</Text>;
  };
});

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseEditTxFeatureFlag = jest.mocked(useEditTxFeatureFlag);

describe("Bitcoin EditOperationPanel", () => {
  const navigate = jest.fn();
  const onPress = jest.fn();
  const operation = { id: "op-id", hash: "op-hash" };
  const account = { id: "account-id" };
  const parentAccount = { id: "parent-id" };

  beforeEach(() => {
    mockedUseNavigation.mockReturnValue({ navigate } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when edit transaction feature is disabled", () => {
    mockedUseEditTxFeatureFlag.mockReturnValue({
      isEditTxEnabled: false,
      isCurrencySupported: true,
    });

    const { toJSON } = render(
      <EditOperationPanel
        isOperationStuck={false}
        operation={operation as never}
        account={account as never}
        parentAccount={parentAccount as never}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("navigates to bitcoin method selection when CTA is pressed", async () => {
    mockedUseEditTxFeatureFlag.mockReturnValue({
      isEditTxEnabled: true,
      isCurrencySupported: true,
    });

    const { user } = render(
      <EditOperationPanel
        isOperationStuck={true}
        operation={operation as never}
        account={account as never}
        parentAccount={parentAccount as never}
        onPress={onPress}
      />,
    );

    await user.press(screen.getByText("edit-operation-panel-cta"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(NavigatorName.BitcoinEditTransaction, {
      screen: ScreenName.BitcoinEditTransactionMethodSelection,
      params: { operation, account, parentAccount },
    });
  });
});
