import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
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

// The section is rendered on its own rather than through the account screen, so `useNavigation`
// has no navigator to reach and `useIsFocused` no screen to report on. The rest of the module,
// the theme in particular, stays real.
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate }),
  useIsFocused: () => true,
}));

// The real bridge resolves the mina family and talks to the network.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
  }),
}));

// Both drawers on this screen sit on the bottom-sheet host, which takes seconds to start and
// needs real timers. Standing it in keeps the drawers themselves, and their contents, real.
jest.mock("~/components/QueuedDrawer", () => {
  const { View } = jest.requireActual("react-native");
  return ({
    isRequestingToBeOpened,
    children,
  }: {
    isRequestingToBeOpened?: boolean;
    children: React.ReactNode;
  }) => (isRequestingToBeOpened ? <View>{children}</View> : null);
});

const banner =
  "Delegate your MINA to a Block Producer and earn rewards from block production. Rewards are distributed based on your delegation amount.";

describe("Delegations (mina)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the account has no staking resources", () => {
    const { toJSON } = render(
      <MinaDelegations account={createMockMinaAccount({ resources: undefined })} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("offers the delegation call to action when the account does not delegate", () => {
    render(<MinaDelegations account={createMockMinaAccount()} />);

    expect(screen.getByText(banner)).toBeOnTheScreen();
    expect(screen.queryByText("See more")).not.toBeOnTheScreen();
  });

  it("navigates to the validator step from the delegation call to action", async () => {
    const { user } = render(<MinaDelegations account={createMockMinaAccount()} />);

    await user.press(screen.getByTestId("proceed-button"));

    expect(navigate).toHaveBeenCalledWith(NavigatorName.MinaStakingFlow, {
      screen: ScreenName.MinaStakingValidator,
      params: { accountId: "js:2:mina:B62qtest:mina" },
    });
  });

  it("lists the current delegation and its validator", () => {
    render(<MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText("Delegation")).toBeOnTheScreen();
    expect(screen.getByText("See more")).toBeOnTheScreen();
    expect(screen.getByText(mockValidators[0].identityName)).toBeOnTheScreen();
    expect(screen.queryByText(banner)).not.toBeOnTheScreen();
  });

  it("opens the drawer on the delegation row and details the validator there", async () => {
    const { user } = render(
      <MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />,
    );

    expect(screen.queryByText("Validator")).not.toBeOnTheScreen();

    await user.press(screen.getByText("See more"));

    expect(screen.getByText("Validator")).toBeOnTheScreen();
    expect(screen.getByText("Producer Address")).toBeOnTheScreen();
    expect(screen.getByText(mockValidators[0].address)).toBeOnTheScreen();
  });

  it("keeps the delegation actions reachable when the delegate metadata is missing", async () => {
    const { user } = render(<MinaDelegations account={createDelegatingMinaAccount(null)} />);

    await user.press(screen.getByText("See more"));

    expect(screen.queryByText("Validator")).not.toBeOnTheScreen();
    expect(screen.getByText("Undelegate")).toBeOnTheScreen();
    expect(screen.getByText("Redelegate")).toBeOnTheScreen();
  });

  it("navigates to the validator step from the redelegate action", async () => {
    const { user } = render(
      <MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />,
    );

    await user.press(screen.getByText("See more"));
    await user.press(screen.getByText("Redelegate"));

    expect(navigate).toHaveBeenCalledWith(NavigatorName.MinaStakingFlow, {
      screen: ScreenName.MinaStakingValidator,
      params: { accountId: "js:2:mina:B62qtest:mina" },
    });
  });

  it("prepares the unstake transaction before skipping to the device step", async () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    const { user } = render(<MinaDelegations account={account} />);

    await user.press(screen.getByText("See more"));
    await user.press(screen.getByText("Undelegate"));

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
    prepareTransaction.mockRejectedValueOnce(new Error("fees unavailable"));
    const { user } = render(
      <MinaDelegations account={createDelegatingMinaAccount(mockValidators[0])} />,
    );

    await user.press(screen.getByText("See more"));
    await user.press(screen.getByText("Undelegate"));

    await waitFor(() => expect(screen.getByTestId("generic-error-modal")).toBeOnTheScreen());
    expect(navigate).not.toHaveBeenCalled();
  });
});
