import React from "react";
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import MinaDelegations from "../Delegations";
import { createMockMinaAccount, createDelegatingMinaAccount, mockValidators } from "./testUtils";
import { NavigatorName, ScreenName } from "~/const";

const navigate = jest.fn();
const createTransaction = jest.fn(() => ({ family: "mina", txType: "delegation" }));
const updateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));
const preparedStatus = { errors: {}, warnings: {} };
const prepareTransaction = jest.fn(async (_account: unknown, tx: object) => ({
  ...tx,
  fees: { fee: "100000000", accountCreationFee: "0" },
  nonce: 7,
}));
const getTransactionStatus = jest.fn(async () => preparedStatus);

jest.mock("@ledgerhq/native-ui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Box: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate }),
  useTheme: () => ({ colors: { card: "#fff", fog: "#eee", alert: "#f00", live: "#0f0" } }),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: jest.fn(() => ({ id: "mina", ticker: "MINA" })),
  getMainAccount: jest.fn((account: unknown) => account),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
  }),
}));

jest.mock("~/components/GenericErrorBottomModal", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ error }: { error: Error | null }) =>
      error ? React.createElement(Text, null, `error:${error.message}`) : null,
  };
});

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ name: "MINA", code: "MINA", magnitude: 9 }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../colors", () => ({ rgba: () => "rgba(0,0,0,0.2)" }));

jest.mock("~/components/AccountSectionLabel", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

jest.mock("~/components/AccountDelegationInfo", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ ctaTitle, onPress }: { ctaTitle: string; onPress: () => void }) =>
      React.createElement(TouchableOpacity, { onPress }, React.createElement(Text, null, ctaTitle)),
  };
});

jest.mock("~/components/Circle", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/icons/Delegate", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/icons/Undelegate", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/icons/images/Rewards", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("../Delegations/Row", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress }: { onPress: () => void }) =>
      React.createElement(
        TouchableOpacity,
        { onPress },
        React.createElement(Text, null, "delegation-row"),
      ),
  };
});

jest.mock("../StakingFlow/ValidatorRow", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ValidatorImage: ({ name }: { name: string }) =>
      React.createElement(Text, null, `image:${name}`),
  };
});

/**
 * Renders the drawer payload flat so the test can assert on the rows the
 * component builds and trigger the actions it wires up.
 */
jest.mock("~/components/DelegationDrawer", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");
  type Row = { label: string; Component: React.ReactNode };
  type Action = { label: string; onPress: () => void; Icon: React.ComponentType<object> };
  return {
    __esModule: true,
    default: ({
      isOpen,
      data,
      actions,
      ValidatorImage,
    }: {
      isOpen: boolean;
      data: Row[];
      actions: Action[];
      ValidatorImage: React.ComponentType<{ size: number }>;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, isOpen ? "drawer-open" : "drawer-closed"),
        React.createElement(ValidatorImage, { size: 32 }),
        ...data.map((row, i) =>
          React.createElement(View, { key: `row-${i}` }, [
            React.createElement(Text, { key: "label" }, row.label),
            React.createElement(View, { key: "value" }, row.Component),
          ]),
        ),
        ...actions.map((action, i) =>
          React.createElement(TouchableOpacity, { key: `action-${i}`, onPress: action.onPress }, [
            React.createElement(Text, { key: "label" }, action.label),
            React.createElement(action.Icon, { key: "icon" }),
          ]),
        ),
      ),
  };
});

describe("Delegations (mina)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the account has no staking resources", () => {
    const account = createMockMinaAccount({ resources: undefined });
    const { toJSON } = render(<MinaDelegations account={account} />);

    expect(toJSON()).toBeNull();
  });

  it("offers the delegation call to action when the account does not delegate", () => {
    render(<MinaDelegations account={createMockMinaAccount()} />);

    expect(screen.getByText("account.delegation.info.cta")).toBeOnTheScreen();
    expect(screen.queryByText("delegation-row")).not.toBeOnTheScreen();
  });

  it("navigates to the validator step from the delegation call to action", async () => {
    const user = userEvent.setup();
    render(<MinaDelegations account={createMockMinaAccount()} />);

    await user.press(screen.getByText("account.delegation.info.cta"));

    expect(navigate).toHaveBeenCalledWith(NavigatorName.MinaStakingFlow, {
      screen: ScreenName.MinaStakingValidator,
      params: { accountId: "js:2:mina:B62qtest:mina" },
    });
  });

  it("lists the current delegation and its validator details", () => {
    render(<MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText("mina.delegation.listHeader")).toBeOnTheScreen();
    expect(screen.getByText("delegation-row")).toBeOnTheScreen();
    expect(screen.getByText("delegation.validator")).toBeOnTheScreen();
    expect(screen.getByText("mina.summaryFooter.producerAddress")).toBeOnTheScreen();
    expect(screen.getByText(mockValidators[0].identityName)).toBeOnTheScreen();
  });

  it("keeps the drawer closed until the delegation row is pressed", async () => {
    const user = userEvent.setup();
    render(<MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText("drawer-closed")).toBeOnTheScreen();

    await user.press(screen.getByText("delegation-row"));

    expect(screen.getByText("drawer-open")).toBeOnTheScreen();
  });

  it("builds no drawer rows when the delegate metadata is missing", () => {
    render(<MinaDelegations account={createDelegatingMinaAccount(null)} />);

    expect(screen.queryByText("delegation.validator")).not.toBeOnTheScreen();
    expect(screen.getByText("drawer-closed")).toBeOnTheScreen();
  });

  it("navigates to the validator step from the redelegate action", async () => {
    const user = userEvent.setup();
    render(<MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    await user.press(screen.getByText("mina.delegation.redelegate"));

    expect(navigate).toHaveBeenCalledWith(NavigatorName.MinaStakingFlow, {
      screen: ScreenName.MinaStakingValidator,
      params: { accountId: "js:2:mina:B62qtest:mina" },
    });
  });

  it("prepares the unstake transaction before skipping to the device step", async () => {
    const user = userEvent.setup();
    const account = createDelegatingMinaAccount(mockValidators[0]);
    render(<MinaDelegations account={account} />);

    await user.press(screen.getByText("mina.delegation.undelegate"));

    expect(createTransaction).toHaveBeenCalledWith(account);
    expect(updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      txType: "unstake",
      recipient: account.freshAddress,
    });
    expect(prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({ txType: "unstake", recipient: account.freshAddress }),
    );
    // The device step signs what it is handed, so the fee and the nonce must be the prepared
    // ones and not the empty defaults createTransaction returns.
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(NavigatorName.MinaStakingFlow, {
        screen: ScreenName.MinaStakingSelectDevice,
        params: {
          accountId: account.id,
          transaction: expect.objectContaining({
            txType: "unstake",
            fees: { fee: "100000000", accountCreationFee: "0" },
            nonce: 7,
          }),
          status: preparedStatus,
        },
      }),
    );
  });

  it("surfaces the error and stays put when the unstake transaction cannot be prepared", async () => {
    const user = userEvent.setup();
    prepareTransaction.mockRejectedValueOnce(new Error("fees unavailable"));
    render(<MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    await user.press(screen.getByText("mina.delegation.undelegate"));

    await waitFor(() => expect(screen.getByText("error:fees unavailable")).toBeOnTheScreen());
    expect(navigate).not.toHaveBeenCalled();
  });
});
