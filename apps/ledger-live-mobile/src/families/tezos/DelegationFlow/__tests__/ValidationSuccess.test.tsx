import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import ValidationSuccess from "../ValidationSuccess";
import { NavigatorName, ScreenName } from "~/const";

const mockNavigate = jest.fn();
const mockPop = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "tezos-acc-1", type: "Account" } }),
}));

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBaker: () => ({ name: "Ledger by Kiln" }),
}));

jest.mock("~/analytics", () => ({ TrackScreen: () => null, track: jest.fn() }));

jest.mock("~/components/PreventNativeBack", () => () => null);

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return { Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text> };
});

jest.mock("~/components/ValidateSuccess", () => {
  const { View } = jest.requireActual("react-native");
  return ({
    primaryButton,
    secondaryButton,
    onViewDetails,
  }: {
    primaryButton?: React.ReactNode;
    secondaryButton?: React.ReactNode;
    onViewDetails?: () => void;
  }) => (
    <View>
      {primaryButton}
      {secondaryButton}
      {onViewDetails ? <View testID="has-view-details" /> : null}
    </View>
  );
});

jest.mock("~/components/Button", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({
    onPress,
    title,
    testID,
    event,
  }: {
    onPress: () => void;
    title?: React.ReactNode;
    testID?: string;
    event?: string;
  }) => (
    <TouchableOpacity testID={testID ?? event} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

const transaction = { family: "tezos", mode: "delegate", recipient: "tz1baker" };

const makeProps = (params: Record<string, unknown> = {}) =>
  ({
    navigation: { navigate: mockNavigate, getParent: () => ({ pop: mockPop }) },
    route: { params: { accountId: "tezos-acc-1", transaction, ...params } },
  }) as unknown as React.ComponentProps<typeof ValidationSuccess>;

describe("Tezos DelegationFlow ValidationSuccess", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPop.mockClear();
  });

  it("chains into the stake flow when stakeAfter is set", () => {
    render(<ValidationSuccess {...makeProps({ stakeAfter: true, parentId: "parent-1" })} />);
    fireEvent.press(screen.getByTestId("TezosDelegationSuccessStake"));
    expect(mockPop).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.TezosStakeFlow, {
      screen: ScreenName.TezosStakeAmount,
      params: { accountId: "tezos-acc-1", parentId: "parent-1", source: undefined },
    });
  });

  it("shows the default view-details action and no stake CTA without stakeAfter", () => {
    render(<ValidationSuccess {...makeProps()} />);
    expect(screen.getByTestId("has-view-details")).toBeTruthy();
    expect(screen.queryByTestId("TezosDelegationSuccessStake")).toBeNull();
  });

  it("forwards the originating source into the stake flow", () => {
    const source = { name: "Account" } as never;
    render(
      <ValidationSuccess {...makeProps({ stakeAfter: true, parentId: "parent-1", source })} />,
    );
    fireEvent.press(screen.getByTestId("TezosDelegationSuccessStake"));
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.TezosStakeFlow, {
      screen: ScreenName.TezosStakeAmount,
      params: { accountId: "tezos-acc-1", parentId: "parent-1", source },
    });
  });

  it("closes via the secondary 'stake later' button", () => {
    render(<ValidationSuccess {...makeProps({ stakeAfter: true })} />);
    fireEvent.press(screen.getByTestId("TezosDelegationSuccessStakeLater"));
    expect(mockPop).toHaveBeenCalled();
  });
});
