import React from "react";
import BigNumber from "bignumber.js";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GlobalTooltipBottomSheet } from "@ledgerhq/lumen-ui-rnative";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import {
  XRP_ACCOUNT,
  XRP_IOU_REMOVAL,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../../__mocks__/account.mock";
import { makeMockAccountBridge, makeNamedError, mockStatus } from "../../__mocks__/bridge.mock";
import { xrpIouAsset, xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";

type ExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  intent: { input: { transaction: object } };
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onUserCancel: () => void;
};

type UserEvents = ReturnType<typeof render>["user"];

let mockExecutorProps: ExecutorProps | undefined;

// DIE drives a real device connection: the test fires its job states by hand
jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    buildDeviceInitializationInput: jest.fn(async () => ({ appName: "XRP" })),
    DeviceIntentExecutor: (props: ExecutorProps) => {
      mockExecutorProps = props;
      const onUserCancel = ReactModule.useRef(props.onUserCancel);
      onUserCancel.current = props.onUserCancel;
      // Like the real executor sheet, it cancels on unmount with the props of its last render
      ReactModule.useEffect(() => () => onUserCancel.current(), []);
      return ReactModule.createElement(View, { testID: "device-intent-executor" });
    },
  };
});

jest.mock("~/datadog", () => {
  return {
    isDatadogEnabled: false,
    initializeDatadogProvider: jest.fn(),
    customErrorEventMapper: jest.fn(),
    customActionEventMapper: jest.fn(),
    customLogEventMapper: jest.fn(),
    viewNamePredicate: jest.fn(),
    broadcastLogger: jest.fn(),
  };
});

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const mockAccountBridge = makeMockAccountBridge();

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const bridgeMock = require("../../__mocks__/bridge.mock");
  return {
    __esModule: true,
    getAccountBridge: () => bridgeMock.makeResolvedAccountBridge(mockAccountBridge),
    getCurrencyBridge: () => bridgeMock.resolvedCurrencyBridge,
  };
});

const OuterStack = createNativeStackNavigator();

const DELETE_BUTTON = `xrp-manage-asset-delete-${xrpIouToken.id}`;

// useBroadcast waits at least 3 seconds
const BROADCAST_TIMEOUT = { timeout: 10000 };

const EMPTY_BALANCE = { balance: new BigNumber(0), spendableBalance: new BigNumber(0) };

function makeAccount(
  tokenAccount: Partial<XrpTokenAccount>,
  pendingOperations: Operation[] = [],
): Account {
  return {
    ...XRP_ACCOUNT,
    pendingOperations,
    subAccounts: [{ ...XRP_IOU_TOKEN_ACCOUNT, ...tokenAccount }],
  };
}

function AccountScreen() {
  return <Text>XRP account screen</Text>;
}

function renderManageAssets(account: Account) {
  return render(
    <>
      <OuterStack.Navigator screenOptions={{ headerShown: false }}>
        <OuterStack.Screen name={ScreenName.Account} component={AccountScreen} />
        <OuterStack.Screen name={NavigatorName.XrpManageTokenFlow} component={component} />
      </OuterStack.Navigator>
      <GlobalTooltipBottomSheet />
    </>,
    {
      navigationInitialState: {
        index: 1,
        routes: [
          { name: ScreenName.Account },
          {
            name: NavigatorName.XrpManageTokenFlow,
            state: {
              index: 0,
              routes: [{ name: ScreenName.XrpManageTokenList, params: { accountId: account.id } }],
            },
          },
        ],
      },
      overrideInitialState: overrideWithAccounts(account),
    },
  );
}

async function confirmDelete(user: UserEvents) {
  const deleteButton = await screen.findByTestId(DELETE_BUTTON);
  await user.press(deleteButton);

  const continueButton = await screen.findByTestId("xrp-delete-token-continue");
  await waitFor(() => expect(continueButton).toBeEnabled());
  await user.press(continueButton);

  await screen.findByTestId("device-intent-executor");
}

function signOnDevice() {
  act(() => {
    mockExecutorProps!.onIntentJobStateChanged({
      type: "signed",
      signedOperation: { operation: XRP_IOU_REMOVAL, signature: "sig" },
    });
  });
}

describe("XRP delete token (integration)", () => {
  const accountWithEmptyToken = makeAccount(EMPTY_BALANCE);
  const accountWithTokenBalance = makeAccount({ balance: new BigNumber(5) });
  const broadcastError = makeNamedError("TransactionBroadcastError");

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    mockStatus(mockAccountBridge, {});
  });

  it("disables Delete while a removal of the token is pending, and tells why", async () => {
    const { user } = renderManageAssets(makeAccount(EMPTY_BALANCE, [XRP_IOU_REMOVAL]));

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    expect(deleteButton).toBeDisabled();
    await user.press(screen.getByTestId(`${DELETE_BUTTON}-reason`));

    const reason = await screen.findByText("Removal pending");
    expect(reason).toBeVisible();
    expect(screen.queryByTestId("xrp-delete-token-confirm")).toBeNull();
  });

  it("disables Delete while the token is frozen, and tells why", async () => {
    const frozen = { ...EMPTY_BALANCE, xrpResources: { isLocked: true } };
    const { user } = renderManageAssets(makeAccount(frozen));

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    expect(deleteButton).toBeDisabled();
    await user.press(screen.getByTestId(`${DELETE_BUTTON}-reason`));

    const reason = await screen.findByText("This token is frozen");
    expect(reason).toBeVisible();
  });

  it("asks to empty a token balance above 0 before removing it", async () => {
    const { user } = renderManageAssets(accountWithTokenBalance);

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    await user.press(deleteButton);

    const title = await screen.findByText("Empty your RLUSD balance to remove it");
    expect(title).toBeVisible();
    expect(
      screen.getByText("Send your remaining RLUSD balance to remove this asset."),
    ).toBeVisible();
    expect(screen.queryByTestId("xrp-delete-token-continue")).toBeNull();
  });

  it("closes the balance sheet on Got it, and opens it again on Delete", async () => {
    const { user } = renderManageAssets(accountWithTokenBalance);

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    await user.press(deleteButton);
    const gotItButton = await screen.findByText("Got it");
    await user.press(gotItButton);

    await waitFor(() => expect(screen.queryByTestId("xrp-delete-token-blocked")).toBeNull());
    await user.press(screen.getByTestId(DELETE_BUTTON));

    const blockedSheet = await screen.findByTestId("xrp-delete-token-blocked");
    expect(blockedSheet).toBeVisible();
  });

  it("confirms the removal of an IOU, and warns the device shows a limit of 0", async () => {
    const { user } = renderManageAssets(accountWithEmptyToken);

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    await user.press(deleteButton);

    const title = await screen.findByText("Are you sure you want to delete RLUSD?");
    expect(title).toBeVisible();
    expect(
      screen.getByText(
        /The locked amount will be released to your .+ account\. Your device will show a trust limit of 0\./,
      ),
    ).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("xrp-delete-token-continue")).toBeEnabled());
  });

  it("confirms the removal of an MPT without the trust limit warning", async () => {
    const mptTokenAccount = { ...XRP_MPT_TOKEN_ACCOUNT, ...EMPTY_BALANCE };
    const { user } = renderManageAssets({ ...XRP_ACCOUNT, subAccounts: [mptTokenAccount] });

    const deleteButton = await screen.findByTestId(`xrp-manage-asset-delete-${xrpMptToken.id}`);
    await user.press(deleteButton);

    const title = await screen.findByText("Are you sure you want to delete TMPT?");
    expect(title).toBeVisible();
    expect(
      screen.getByText(/The locked amount will be released to your .+ account\.$/),
    ).toBeVisible();
  });

  it("shows a coin-xrp refusal and disables Continue", async () => {
    mockStatus(mockAccountBridge, { escrow: makeNamedError("XrpOptOutTokenInEscrow") });
    const { user } = renderManageAssets(accountWithEmptyToken);

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    await user.press(deleteButton);

    const refusal = await screen.findByText("Some of this token is in escrow");
    expect(refusal).toBeVisible();
    expect(
      screen.getByText("Remove the token once the escrow is finished or canceled."),
    ).toBeVisible();
    expect(screen.getByTestId("xrp-delete-token-continue")).toBeDisabled();
  });

  it("signs the removal on the device, then shows the success sheet", async () => {
    const { user } = renderManageAssets(accountWithEmptyToken);

    await confirmDelete(user);

    expect(mockExecutorProps?.sourceFlow).toBe("manage_assets");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      action: "delete",
      currency: XRP_ACCOUNT.currency.id,
      tokenType: "iou",
    });
    expect(mockExecutorProps?.intent.input.transaction).toMatchObject({
      mode: "optOut",
      amount: new BigNumber(0),
      ...xrpIouAsset,
    });
    signOnDevice();

    const title = await screen.findByText(
      "RLUSD was successfully removed from your account",
      {},
      BROADCAST_TIMEOUT,
    );
    expect(title).toBeVisible();
    expect(screen.getByText("You can add this asset again anytime.")).toBeVisible();
    expect(screen.getByTestId(DELETE_BUTTON)).toBeDisabled();

    await user.press(screen.getByText("Got it"));

    const accountScreen = await screen.findByText("XRP account screen");
    expect(accountScreen).toBeVisible();
  });

  it("shows a failed broadcast that may still go through, then signs again on Try again", async () => {
    jest.spyOn(mockAccountBridge, "broadcast").mockRejectedValueOnce(broadcastError);
    const { user } = renderManageAssets(accountWithEmptyToken);

    await confirmDelete(user);
    signOnDevice();

    const title = await screen.findByText("Failed to remove asset", {}, BROADCAST_TIMEOUT);
    expect(title).toBeVisible();
    expect(screen.getByText("Transaction Broadcast Unsuccessfull")).toBeVisible();
    expect(
      screen.getByText(
        "Your transaction may have failed. Please wait a moment then check the transaction history before trying again.",
      ),
    ).toBeVisible();
    expect(screen.queryByTestId("device-intent-executor")).toBeNull();

    await user.press(screen.getByTestId("xrp-delete-token-retry"));

    const executor = await screen.findByTestId("device-intent-executor");
    expect(executor).toBeVisible();
  });

  it("shows a failure before signing without the broadcast warning", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("No device"));
    const { user } = renderManageAssets(accountWithEmptyToken);

    const deleteButton = await screen.findByTestId(DELETE_BUTTON);
    await user.press(deleteButton);
    const continueButton = await screen.findByTestId("xrp-delete-token-continue");
    await waitFor(() => expect(continueButton).toBeEnabled());
    await user.press(continueButton);

    const title = await screen.findByText("Failed to remove asset");
    expect(title).toBeVisible();
    expect(screen.queryByTestId("xrp-delete-token-broadcast-error")).toBeNull();
  });

  it("cancels on the device, and opens the confirmation again on Delete", async () => {
    const { user } = renderManageAssets(accountWithEmptyToken);

    await confirmDelete(user);
    act(() => mockExecutorProps!.onUserCancel());

    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
    await user.press(screen.getByTestId(DELETE_BUTTON));

    const confirmSheet = await screen.findByTestId("xrp-delete-token-confirm");
    expect(confirmSheet).toBeVisible();
  });

  it("keeps the flow open when the device sheet is closed during the broadcast", async () => {
    const { user } = renderManageAssets(accountWithEmptyToken);

    await confirmDelete(user);
    signOnDevice();
    act(() => mockExecutorProps!.onUserCancel());

    const title = await screen.findByText(
      "RLUSD was successfully removed from your account",
      {},
      BROADCAST_TIMEOUT,
    );
    expect(title).toBeVisible();
  });
});
