import React from "react";
import { fireEvent, screen } from "@tests/test-renderer";
import { render } from "@tests/test-renderer";
import CardanoDelegations from "./index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useTheme: () => ({ colors: { fog: "fog", alert: "alert" } }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock child components
jest.mock("~/components/AccountDelegationInfo", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onPress, title }: { onPress: () => void; title: string }) => (
    <TouchableOpacity onPress={onPress} testID="account-delegation-info">
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock("~/components/DelegationDrawer", () => {
  const { View, Button } = jest.requireActual("react-native");
  return ({
    isOpen,
    actions,
  }: {
    isOpen: boolean;
    actions: { label: string; onPress: () => void }[];
  }) =>
    isOpen ? (
      <View testID="delegation-drawer">
        {actions.map((action: { label: string; onPress: () => void }, i: number) => (
          <Button
            key={i}
            title={action.label}
            onPress={action.onPress}
            testID={`drawer-action-${action.label}`}
          />
        ))}
      </View>
    ) : null;
});

jest.mock("./Row", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} testID="delegation-row">
      <Text>Delegation Row</Text>
    </TouchableOpacity>
  );
});

jest.mock("./DRepDelegationSelfTransactionInfoDrawer", () => {
  const { View } = jest.requireActual("react-native");
  return ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <View testID="drep-self-tx-drawer" /> : null;
});

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useAccountName: () => "Mock Account",
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ADA", magnitude: 6 }),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: (account: unknown) => account,
  flattenAccounts: (accounts: unknown[]) => accounts,
}));
jest.mock("@ledgerhq/live-common/explorers", () => ({
  getDefaultExplorerView: jest.fn(),
  getStakePoolExplorer: jest.fn(),
}));

const mockAccountBase: CardanoAccount = {
  type: "Account",
  id: "test-account-id",
  currency: { id: "cardano", name: "Cardano" },
  balance: new BigNumber(100),
  cardanoResources: {
    delegation: {
      rewards: new BigNumber(0),
      dRepHex: undefined,
      poolId: null,
    },
  },
} as unknown as CardanoAccount;

describe("CardanoDelegations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null if not a Cardano account", () => {
    const { toJSON } = render(
      <CardanoDelegations account={{ type: "TokenAccount" } as unknown as CardanoAccount} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders empty state (AccountDelegationInfo) when no pool delegated", () => {
    render(<CardanoDelegations account={mockAccountBase} />);
    expect(screen.getByTestId("account-delegation-info")).toBeTruthy();
    expect(screen.queryByTestId("delegation-row")).toBeNull();
  });

  it("navigates to DelegationStarted when empty state pressed", () => {
    render(<CardanoDelegations account={mockAccountBase} />);
    fireEvent.press(screen.getByTestId("account-delegation-info"));
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoDelegationFlow, {
      screen: ScreenName.CardanoDelegationStarted,
      params: { accountId: mockAccountBase.id },
    });
  });

  it("renders populated state (DelegationRow) when delegated", () => {
    const delegatedAccount = {
      ...mockAccountBase,
      cardanoResources: {
        delegation: {
          ...mockAccountBase.cardanoResources.delegation,
          poolId: "pool123",
          name: "MyPool",
          status: true,
        },
      },
    } as unknown as CardanoAccount;

    render(<CardanoDelegations account={delegatedAccount} />);
    expect(screen.getByTestId("delegation-row")).toBeTruthy();
    expect(screen.queryByTestId("account-delegation-info")).toBeNull();
  });

  it("opens DelegationDrawer when row is pressed", () => {
    const delegatedAccount = {
      ...mockAccountBase,
      cardanoResources: {
        delegation: {
          poolId: "pool123",
        },
      },
    } as unknown as CardanoAccount;

    render(<CardanoDelegations account={delegatedAccount} />);
    fireEvent.press(screen.getByTestId("delegation-row"));
    expect(screen.getByTestId("delegation-drawer")).toBeTruthy();
  });

  it("handles redelegate action", () => {
    const delegatedAccount = {
      ...mockAccountBase,
      cardanoResources: {
        delegation: {
          poolId: "pool123",
        },
      },
    } as unknown as CardanoAccount;

    render(<CardanoDelegations account={delegatedAccount} />);

    // Open drawer
    fireEvent.press(screen.getByTestId("delegation-row"));

    // Find and press redelegate action
    const redelegateBtn = screen.getByTestId("drawer-action-delegation.actions.redelegate");
    fireEvent.press(redelegateBtn);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoDelegationFlow, {
      screen: ScreenName.CardanoDelegationSummary,
      params: { accountId: delegatedAccount.id },
    });
  });

  it("handles undelegate action (Standard)", () => {
    const delegatedAccount = {
      ...mockAccountBase,
      cardanoResources: {
        delegation: {
          poolId: "pool123",
          rewards: new BigNumber(0),
        },
      },
    } as unknown as CardanoAccount;

    render(<CardanoDelegations account={delegatedAccount} />);

    fireEvent.press(screen.getByTestId("delegation-row"));

    const undelegateBtn = screen.getByTestId("drawer-action-delegation.actions.undelegate");
    fireEvent.press(undelegateBtn);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoUndelegationFlow, {
      screen: ScreenName.CardanoUndelegationSummary,
      params: {
        accountId: delegatedAccount.id,
        delegation: expect.objectContaining({ poolId: "pool123" }),
      },
    });
  });

  it("opens DRep self-tx drawer when undelegating with rewards and no DRep", () => {
    const accountWithRewards = {
      ...mockAccountBase,
      cardanoResources: {
        delegation: {
          poolId: "pool123",
          rewards: new BigNumber(100),
          dRepHex: undefined,
        },
      },
    } as unknown as CardanoAccount;

    render(<CardanoDelegations account={accountWithRewards} />);

    fireEvent.press(screen.getByTestId("delegation-row"));

    const undelegateBtn = screen.getByTestId("drawer-action-delegation.actions.undelegate");
    fireEvent.press(undelegateBtn);

    expect(screen.getByTestId("drep-self-tx-drawer")).toBeTruthy();
    // Should NOT navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
