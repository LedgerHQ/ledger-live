import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import EarnRewards from "../EarnRewards";
import { ScreenName } from "~/const";

const mockNavigate = jest.fn();
let mockIsDelegated = false;

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "tezos-acc-1", type: "Account" } }),
}));

jest.mock("@ledgerhq/live-common/families/tezos/staking", () => ({
  isAccountDelegating: () => mockIsDelegated,
}));

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (key: string) => key }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});

jest.mock("~/analytics", () => ({ TrackScreen: () => null }));

jest.mock("~/components/Alert", () => () => null);

jest.mock("~/components/wrappedUi/Button", () => {
  const { TouchableOpacity } = jest.requireActual("react-native");
  return ({
    onPress,
    testID,
    children,
  }: {
    onPress: () => void;
    testID?: string;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity testID={testID} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
});

const makeProps = (params: Record<string, unknown> = {}) =>
  ({
    navigation: { navigate: mockNavigate },
    route: { params: { accountId: "tezos-acc-1", ...params } },
  }) as unknown as React.ComponentProps<typeof EarnRewards>;

describe("Tezos EarnRewards", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockIsDelegated = false;
  });

  it("renders both step cards and the CTA", () => {
    render(<EarnRewards {...makeProps()} />);
    expect(screen.getByText("tezos.earnRewards.delegation.title")).toBeTruthy();
    expect(screen.getByText("tezos.earnRewards.staking.title")).toBeTruthy();
    expect(screen.getByTestId("tezos-earn-rewards-start-button")).toBeTruthy();
  });

  it("routes to the delegation summary when the account is not delegated", () => {
    render(<EarnRewards {...makeProps({ parentId: "parent-1" })} />);
    fireEvent.press(screen.getByTestId("tezos-earn-rewards-start-button"));
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.DelegationSummary, {
      accountId: "tezos-acc-1",
      parentId: "parent-1",
    });
  });

  it("does not navigate when already delegated (stake flow lands in a later story)", () => {
    mockIsDelegated = true;
    render(<EarnRewards {...makeProps()} />);
    fireEvent.press(screen.getByTestId("tezos-earn-rewards-start-button"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
