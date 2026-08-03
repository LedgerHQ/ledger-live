import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { useStake } from "LLM/hooks/useStake/useStake";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import { NavigatorName, ScreenName } from "~/const";
import HederaDelegations from "../index";
import {
  HEDERA_ACCOUNT_1,
  HEDERA_ASSOCIATED_SUBACCOUNT,
  makeHederaAccount,
} from "../../__mocks__/account.mock";
import { mockDelegation, mockEnrichedDelegation } from "../../__mocks__/delegation.mock";

const mockNavigate = jest.fn();

jest.mock("LLM/hooks/useStake/useStake", () => ({ useStake: jest.fn() }));

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaEnrichedDelegation: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useTheme: () => ({
    colors: { fog: "#ccc", alert: "#f00", yellow: "#ff0", live: "#000", background: "#fff" },
  }),
}));

jest.mock("~/components/DelegationDrawer", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({
    isOpen,
    actions,
  }: {
    isOpen: boolean;
    actions?: Array<{ label: string; disabled?: boolean; onPress: () => void }>;
  }) => {
    if (!isOpen) return null;
    return (
      <View testID="delegation-drawer">
        {actions?.map((action, i) => (
          <TouchableOpacity
            key={i}
            testID={`drawer-action-${i}`}
            accessibilityState={{ disabled: !!action.disabled }}
            onPress={action.disabled ? undefined : action.onPress}
          >
            <Text>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
});

jest.mock("~/families/hedera/Delegations/DelegationRewards", () => () => null);

jest.mock("~/families/hedera/shared/DelegationStatusModal", () => ({
  DelegationStatusModal: () => null,
}));

jest.mock("~/families/hedera/shared/ValidatorIcon", () => () => null);

const mockUseStake = jest.mocked(useStake);
const mockUseHederaEnrichedDelegation = jest.mocked(useHederaEnrichedDelegation);

beforeEach(() => {
  jest.clearAllMocks();
  mockUseStake.mockReturnValue({
    getCanStakeCurrency: jest.fn().mockReturnValue(true),
  } as never);
  mockUseHederaEnrichedDelegation.mockReturnValue(mockEnrichedDelegation as never);
});

describe("HederaDelegations", () => {
  describe("guard clauses — renders null", () => {
    it("renders null for a token (sub)account", () => {
      const { toJSON } = render(<HederaDelegations account={HEDERA_ASSOCIATED_SUBACCOUNT} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [HEDERA_ACCOUNT_1] },
        }),
      });
      expect(toJSON()).toBeNull();
    });

    it("renders null when staking is disabled for the currency", () => {
      mockUseStake.mockReturnValue({
        getCanStakeCurrency: jest.fn().mockReturnValue(false),
      } as never);

      const account = makeHederaAccount();
      const { toJSON } = render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });
      expect(toJSON()).toBeNull();
    });

    it("renders null when hederaResources is absent", () => {
      const { toJSON } = render(<HederaDelegations account={HEDERA_ACCOUNT_1} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [HEDERA_ACCOUNT_1] },
        }),
      });
      expect(toJSON()).toBeNull();
    });
  });

  describe("without an active delegation", () => {
    it("renders DelegationPlaceholder when delegation is null", () => {
      const account = makeHederaAccount({ delegation: null });
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });
      expect(screen.getByText("How delegation works")).toBeVisible();
    });
  });

  describe("with an active delegation", () => {
    const buildAccount = () => makeHederaAccount({ delegation: mockDelegation });

    it("renders the delegation row", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });
      expect(screen.getByText("Hedera Node 3")).toBeVisible();
    });

    it("opens the delegation drawer when the row is pressed", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      expect(screen.queryByTestId("delegation-drawer")).toBeNull();
      fireEvent.press(screen.getByText("Hedera Node 3"));
      expect(screen.getByTestId("delegation-drawer")).toBeVisible();
    });

    it("shows Redelegate, Collect rewards, and Undelegate action labels in the drawer", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      fireEvent.press(screen.getByText("Hedera Node 3"));

      expect(screen.getByText("Redelegate")).toBeVisible();
      expect(screen.getByText("Collect rewards")).toBeVisible();
      expect(screen.getByText("Undelegate")).toBeVisible();
    });

    it("disables the Collect rewards action when pendingReward is zero", () => {
      mockUseHederaEnrichedDelegation.mockReturnValue({
        ...mockEnrichedDelegation,
        pendingReward: new BigNumber(0),
      } as never);

      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      fireEvent.press(screen.getByText("Hedera Node 3"));

      expect(screen.getByTestId("drawer-action-1")).toHaveProp("accessibilityState", {
        disabled: true,
      });
    });

    it("navigates to HederaRedelegationFlow with correct params when Redelegate is pressed", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      fireEvent.press(screen.getByText("Hedera Node 3"));
      fireEvent.press(screen.getByTestId("drawer-action-0"));

      expect(mockNavigate).toHaveBeenCalledWith(
        NavigatorName.HederaRedelegationFlow,
        expect.objectContaining({
          screen: ScreenName.HederaRedelegationSelectValidator,
          params: expect.objectContaining({ accountId: account.id }),
        }),
      );
    });

    it("navigates to HederaClaimRewardsFlow with correct params when Collect rewards is pressed", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      fireEvent.press(screen.getByText("Hedera Node 3"));
      fireEvent.press(screen.getByTestId("drawer-action-1"));

      expect(mockNavigate).toHaveBeenCalledWith(
        NavigatorName.HederaClaimRewardsFlow,
        expect.objectContaining({
          screen: ScreenName.HederaClaimRewardsSelectReward,
          params: expect.objectContaining({ accountId: account.id }),
        }),
      );
    });

    it("navigates to HederaUndelegationFlow with correct params when Undelegate is pressed", () => {
      const account = buildAccount();
      render(<HederaDelegations account={account} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [account] },
        }),
      });

      fireEvent.press(screen.getByText("Hedera Node 3"));
      fireEvent.press(screen.getByTestId("drawer-action-2"));

      expect(mockNavigate).toHaveBeenCalledWith(
        NavigatorName.HederaUndelegationFlow,
        expect.objectContaining({
          screen: ScreenName.HederaUndelegationAmount,
          params: expect.objectContaining({ accountId: account.id }),
        }),
      );
    });
  });
});
