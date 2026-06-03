import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, screen, render } from "@tests/test-renderer";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import LegacyAccountBodyHeader from "../LegacyAccountBodyHeader";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return { Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text> };
});

type DelegationLike = {
  baker?: { name: string };
  address: string;
  operation: { date: Date };
  isPending?: boolean;
} | null;

let mockDelegation: DelegationLike;
let mockPositions: { delegate?: string }[];
jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useDelegation: () => mockDelegation,
  useStakingPositions: () => mockPositions,
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", name: "tez", magnitude: 6 }),
}));

jest.mock("../BakerImage", () => () => null);
jest.mock("~/components/CurrencyUnitValue", () => () => null);
jest.mock("~/components/CounterValue", () => () => null);

jest.mock("~/components/LText", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
});

jest.mock("~/components/wrappedUi/Button", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({
    onPress,
    event,
    children,
  }: {
    onPress: () => void;
    event: string;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity testID={event} onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

jest.mock("../DelegationDetailsModal", () => {
  const { View } = jest.requireActual("react-native");
  return ({ isOpened }: { isOpened: boolean }) =>
    isOpened ? <View testID="delegation-details-modal" /> : null;
});

const account = {
  type: "Account",
  id: "tezos-acc-1",
  currency: { id: "tezos", name: "Tezos", ticker: "XTZ", units: [] },
  balance: new BigNumber(100),
} as unknown as AccountLike;

describe("LegacyAccountBodyHeader", () => {
  beforeEach(() => {
    mockDelegation = null;
    mockPositions = [];
  });

  it("renders nothing without a delegation or staking position", () => {
    const { toJSON } = render(<LegacyAccountBodyHeader account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("renders the baker name and a view-details button when delegated", () => {
    mockDelegation = {
      baker: { name: "GreenBaker" },
      address: "tz1delegateaddressxxxxxxxxxxxxxxxx",
      operation: { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      isPending: false,
    };
    render(<LegacyAccountBodyHeader account={account} />);
    expect(screen.getByText("GreenBaker")).toBeTruthy();
    expect(screen.getByTestId("ViewDelegationDetails")).toBeTruthy();
  });

  it("opens the details modal when view-details is pressed", () => {
    mockDelegation = {
      baker: { name: "GreenBaker" },
      address: "tz1delegateaddressxxxxxxxxxxxxxxxx",
      operation: { date: new Date() },
    };
    render(<LegacyAccountBodyHeader account={account} />);
    expect(screen.queryByTestId("delegation-details-modal")).toBeNull();
    fireEvent.press(screen.getByTestId("ViewDelegationDetails"));
    expect(screen.getByTestId("delegation-details-modal")).toBeTruthy();
  });

  it("shows the staking-position delegate when there is no delegation", () => {
    mockPositions = [{ delegate: "tz1stakedelegatexxxxxxxxxxxxxxxxxx" }];
    render(<LegacyAccountBodyHeader account={account} />);
    expect(
      screen.getByText(shortAddressPreview("tz1stakedelegatexxxxxxxxxxxxxxxxxx")),
    ).toBeTruthy();
    expect(screen.queryByTestId("ViewDelegationDetails")).toBeNull();
  });

  it("renders without crashing when a staking position has no delegate", () => {
    mockPositions = [{}];
    render(<LegacyAccountBodyHeader account={account} />);
    expect(screen.getByText("delegation.delegation")).toBeTruthy();
  });
});
