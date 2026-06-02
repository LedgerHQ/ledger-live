import React from "react";
import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import { fireEvent, screen, render } from "@tests/test-renderer";
import type { AccountLike } from "@ledgerhq/types-live";
import TezosDelegation from "../index";
import { NavigatorName, ScreenName } from "~/const";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useTheme: () => ({ colors: { card: "#111111", live: "#00ff00", lightGrey: "#eeeeee" } }),
}));

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (key: string) => key }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});

// Drive every screen state through the staking-info hook.
let mockStakingInfo: ReturnType<typeof makeInfo>;
let mockBakerByAddress: Record<string, { name: string } | null> = {};
jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => mockStakingInfo,
  useBaker: (address: string) => mockBakerByAddress[address] ?? null,
  isFinalizablePosition: (uid: string) => uid.includes("final"),
}));

jest.mock("@ledgerhq/live-common/explorers", () => ({
  getAddressExplorer: () => "https://tzkt.io/tz1abc/operations",
  getDefaultExplorerView: () => ({}),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", name: "tez", magnitude: 6 }),
}));

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useAccountName: () => "My Tezos Account",
}));

jest.mock("../../BakerImage", () => () => null);
jest.mock("~/icons/images/Rewards", () => () => null);

jest.mock("~/components/LText", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
});

jest.mock("~/components/Touchable", () => {
  const { TouchableOpacity } = jest.requireActual("react-native");
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
      {children}
    </TouchableOpacity>
  );
});

jest.mock("~/components/AccountDelegationInfo", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onPress, title }: { onPress: () => void; title: string }) => (
    <TouchableOpacity testID="account-delegation-info" onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock("~/components/AccountSectionLabel", () => {
  const { View, Text } = jest.requireActual("react-native");
  return ({ name, RightComponent }: { name: string; RightComponent?: React.ReactNode }) => (
    <View testID={`section-${name}`}>
      <Text>{name}</Text>
      {RightComponent}
    </View>
  );
});

jest.mock("../LabelRight", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ label }: { label: string }) => <Text>{label}</Text>;
});

jest.mock("../Row", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({
    onPress,
    statusLabel,
    baker,
    address,
  }: {
    onPress: () => void;
    statusLabel?: string;
    baker?: { name: string } | null;
    address: string;
  }) => (
    <TouchableOpacity testID="delegation-row" onPress={onPress}>
      <Text>{statusLabel ?? "row"}</Text>
      <Text testID="row-baker">{baker?.name ?? ""}</Text>
      <Text testID="row-address">{address}</Text>
    </TouchableOpacity>
  );
});

jest.mock("~/components/DelegationDrawer", () => {
  const { View, Text, TouchableOpacity } = jest.requireActual("react-native");
  return ({
    isOpen,
    onClose,
    data,
  }: {
    isOpen: boolean;
    onClose: () => void;
    data: { label: string; Component: React.ReactNode }[];
  }) =>
    isOpen ? (
      <View testID="delegation-drawer">
        <TouchableOpacity testID="drawer-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
        {data.map(field => (
          <View key={field.label} testID={`drawer-field-${field.label}`}>
            {field.Component}
          </View>
        ))}
      </View>
    ) : null;
});

type StakingPositionLike = {
  uid: string;
  amount: BigNumber;
  createdAt?: string;
  delegate?: string;
};

function makeInfo(
  overrides: Partial<{
    isDelegated: boolean;
    isStaked: boolean;
    hasUnstaking: boolean;
    stakedBalance: BigNumber;
    availableBalance: BigNumber;
    unstakingPositions: StakingPositionLike[];
    delegateAddress: string;
    delegation: { address: string; baker: { name: string }; operation: { date: Date } } | null;
  }> = {},
) {
  return {
    isDelegated: false,
    isStaked: false,
    hasUnstaking: false,
    stakedBalance: new BigNumber(0),
    availableBalance: new BigNumber(0),
    unstakingPositions: [] as StakingPositionLike[],
    delegateAddress: "",
    delegation: null as {
      address: string;
      baker: { name: string };
      operation: { date: Date };
    } | null,
    ...overrides,
  };
}

const makeAccount = (overrides: Record<string, unknown> = {}): AccountLike =>
  ({
    type: "Account",
    id: "tezos-acc-1",
    currency: {
      id: "tezos",
      name: "Tezos",
      ticker: "XTZ",
      units: [{ code: "XTZ", name: "tez", magnitude: 6 }],
    },
    balance: new BigNumber(100),
    spendableBalance: new BigNumber(100),
    operations: [],
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as unknown as AccountLike;

describe("TezosDelegation (staking dashboard)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockStakingInfo = makeInfo();
    mockBakerByAddress = {};
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("renders null for a non-Account", () => {
    const { toJSON } = render(<TezosDelegation account={makeAccount({ type: "TokenAccount" })} />);
    expect(toJSON()).toBeNull();
  });

  it("renders the empty state when nothing is staked, delegated or unstaking", () => {
    render(<TezosDelegation account={makeAccount()} />);
    expect(screen.getByTestId("account-delegation-info")).toBeTruthy();
    expect(screen.queryByTestId("delegation-row")).toBeNull();
  });

  it("navigates to the delegation flow from the empty-state CTA", () => {
    render(<TezosDelegation account={makeAccount({ id: "acc-42" })} />);
    fireEvent.press(screen.getByTestId("account-delegation-info"));
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationStarted,
      params: { accountId: "acc-42" },
    });
  });

  it("renders only the delegation section when delegated", () => {
    mockStakingInfo = makeInfo({
      isDelegated: true,
      availableBalance: new BigNumber(50),
      delegateAddress: "tz1delegate",
      delegation: {
        address: "tz1delegate",
        baker: { name: "MyBaker" },
        operation: { date: new Date("2026-05-01") },
      },
    });
    render(<TezosDelegation account={makeAccount()} />);
    expect(screen.getByTestId("section-tezos.delegation.sectionLabel")).toBeTruthy();
    expect(screen.queryByTestId("section-tezos.staking.sectionLabel")).toBeNull();
    expect(screen.getAllByTestId("delegation-row")).toHaveLength(1);
  });

  it("opens the delegation drawer and opens the explorer from the address field", () => {
    mockStakingInfo = makeInfo({
      isDelegated: true,
      availableBalance: new BigNumber(50),
      delegateAddress: "tz1delegate",
    });
    render(<TezosDelegation account={makeAccount()} />);

    fireEvent.press(screen.getByTestId("delegation-row"));
    expect(screen.getByTestId("delegation-drawer")).toBeTruthy();
    expect(screen.getByTestId("drawer-field-delegation.delegatedAccount")).toBeTruthy();

    fireEvent.press(screen.getByTestId("TezosDelegationOpenExplorer"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://tzkt.io/tz1abc/operations");
  });

  it("renders only the staking section with an active stake", () => {
    mockStakingInfo = makeInfo({ isStaked: true, stakedBalance: new BigNumber(10) });
    render(
      <TezosDelegation
        account={makeAccount({ operations: [{ type: "STAKE", date: new Date("2026-05-20") }] })}
      />,
    );
    expect(screen.getByTestId("section-tezos.staking.sectionLabel")).toBeTruthy();
    expect(screen.queryByTestId("section-tezos.delegation.sectionLabel")).toBeNull();
    expect(screen.getAllByTestId("delegation-row")).toHaveLength(1);
  });

  it("opens the stake drawer from the active stake row", () => {
    mockStakingInfo = makeInfo({ isStaked: true, stakedBalance: new BigNumber(10) });
    render(<TezosDelegation account={makeAccount()} />);
    fireEvent.press(screen.getByTestId("delegation-row"));
    expect(screen.getByTestId("delegation-drawer")).toBeTruthy();
  });

  it("renders unstaking rows tagged with their status", () => {
    mockStakingInfo = makeInfo({
      hasUnstaking: true,
      unstakingPositions: [
        { uid: "unstaking-1", amount: new BigNumber(3), createdAt: "2026-05-25" },
        { uid: "finalizable-1", amount: new BigNumber(2), createdAt: "2026-05-10" },
      ],
    });
    render(<TezosDelegation account={makeAccount()} />);
    expect(screen.getByTestId("section-tezos.staking.sectionLabel")).toBeTruthy();
    expect(screen.getAllByTestId("delegation-row")).toHaveLength(2);
    expect(screen.getByText("tezos.staking.unstaking")).toBeTruthy();
    expect(screen.getByText("tezos.staking.available")).toBeTruthy();
  });

  it("opens the unstaking drawer with a status field", () => {
    mockStakingInfo = makeInfo({
      hasUnstaking: true,
      unstakingPositions: [
        { uid: "finalizable-1", amount: new BigNumber(2), createdAt: "2026-05-10" },
      ],
    });
    render(<TezosDelegation account={makeAccount()} />);
    fireEvent.press(screen.getByTestId("delegation-row"));
    expect(screen.getByTestId("drawer-field-tezos.staking.status")).toBeTruthy();
  });

  it("renders both sections when staked and delegated", () => {
    mockStakingInfo = makeInfo({
      isStaked: true,
      isDelegated: true,
      stakedBalance: new BigNumber(10),
      availableBalance: new BigNumber(40),
      delegateAddress: "tz1delegate",
    });
    render(
      <TezosDelegation
        account={makeAccount({
          operations: [
            { type: "STAKE", date: new Date("2026-05-18") },
            { type: "DELEGATE", date: new Date("2026-05-02") },
          ],
        })}
      />,
    );
    expect(screen.getByTestId("section-tezos.staking.sectionLabel")).toBeTruthy();
    expect(screen.getByTestId("section-tezos.delegation.sectionLabel")).toBeTruthy();
    expect(screen.getAllByTestId("delegation-row")).toHaveLength(2);
  });

  it("resolves baker per unstaking position when re-delegated to another baker", () => {
    mockBakerByAddress = {
      tz1A: { name: "BakerA" },
      tz1B: { name: "BakerB" },
    };
    mockStakingInfo = makeInfo({
      isDelegated: true,
      hasUnstaking: true,
      availableBalance: new BigNumber(50),
      delegateAddress: "tz1B",
      delegation: {
        address: "tz1B",
        baker: { name: "BakerB" },
        operation: { date: new Date("2026-05-15") },
      },
      unstakingPositions: [
        {
          uid: "unstaking-1",
          amount: new BigNumber(3),
          createdAt: "2026-05-20",
          delegate: "tz1A",
        },
      ],
    });
    render(<TezosDelegation account={makeAccount()} />);
    const rows = screen.getAllByTestId("delegation-row");
    const bakerLabels = screen.getAllByTestId("row-baker").map(n => n.props.children);
    const addressLabels = screen.getAllByTestId("row-address").map(n => n.props.children);
    expect(rows).toHaveLength(2);
    expect(bakerLabels).toEqual(expect.arrayContaining(["BakerA", "BakerB"]));
    expect(addressLabels).toEqual(expect.arrayContaining(["tz1A", "tz1B"]));
  });

  it("shows the unstaking baker when the account is fully un-delegated", () => {
    mockBakerByAddress = { tz1A: { name: "BakerA" } };
    mockStakingInfo = makeInfo({
      hasUnstaking: true,
      unstakingPositions: [
        {
          uid: "finalizable-1",
          amount: new BigNumber(2),
          createdAt: "2026-05-10",
          delegate: "tz1A",
        },
      ],
    });
    render(<TezosDelegation account={makeAccount()} />);
    expect(screen.getByTestId("row-baker").props.children).toBe("BakerA");
    expect(screen.getByTestId("row-address").props.children).toBe("tz1A");
  });

  it("closes the drawer", () => {
    mockStakingInfo = makeInfo({ isStaked: true, stakedBalance: new BigNumber(10) });
    render(<TezosDelegation account={makeAccount()} />);
    fireEvent.press(screen.getByTestId("delegation-row"));
    expect(screen.getByTestId("delegation-drawer")).toBeTruthy();
    fireEvent.press(screen.getByTestId("drawer-close"));
    expect(screen.queryByTestId("delegation-drawer")).toBeNull();
  });
});
