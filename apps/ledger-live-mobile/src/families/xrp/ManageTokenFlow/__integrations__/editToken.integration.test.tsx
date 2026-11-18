import React from "react";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { HttpResponse, http, server } from "@tests/server";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../../__mocks__/account.mock";
import {
  makeMockAccountBridge,
  makeNamedError,
  mockTransactionStatus,
} from "../../__mocks__/bridge.mock";
import { xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";

jest.mock(
  "@ledgerhq/live-common/hw/actions/app",
  () => require("../../__mocks__/deviceConnection.mock").hwActionsAppModule,
);

jest.mock(
  "@ledgerhq/live-common/hw/index",
  () => require("../../__mocks__/deviceConnection.mock").hwIndexModule,
);

jest.mock(
  "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling",
  () => require("../../__mocks__/deviceConnection.mock").deviceLockedPollingModule,
);

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
  const {
    makeResolvedAccountBridge,
    resolvedCurrencyBridge,
  } = require("../../__mocks__/bridge.mock");
  return {
    __esModule: true,
    getAccountBridge: () => makeResolvedAccountBridge(mockAccountBridge),
    getCurrencyBridge: () => resolvedCurrencyBridge,
  };
});

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

const EDIT_BUTTON = `xrp-manage-asset-edit-${xrpIouToken.id}`;

const STORED_RESOURCES = {
  isLocked: false,
  isRippling: true,
  limit: new BigNumber(1000),
};

const OuterStack = createNativeStackNavigator();

type UserEvents = ReturnType<typeof render>["user"];

function OperationDetailsStub(props: Readonly<{ route: { params?: object } }>) {
  const { operation } = props.route.params as { operation: { type: string } };

  return <Text testID="operation-details">{operation.type}</Text>;
}

function ManageTokenFlowHarness() {
  return (
    <OuterStack.Navigator screenOptions={{ headerShown: false }}>
      <OuterStack.Screen name={NavigatorName.XrpManageTokenFlow} component={component} />
      <OuterStack.Screen name={ScreenName.OperationDetails} component={OperationDetailsStub} />
    </OuterStack.Navigator>
  );
}

function makeAccountWithToken(overrides: Partial<XrpTokenAccount>): Account {
  const tokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(0), ...overrides };

  return { ...XRP_ACCOUNT, subAccounts: [tokenAccount] };
}

function renderManageAssets(account: Account) {
  return render(<ManageTokenFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
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
  });
}

async function renderEditDetails(overrides: Partial<XrpTokenAccount> = {}) {
  const view = renderManageAssets(makeAccountWithToken(overrides));

  await view.user.press(await screen.findByTestId(EDIT_BUTTON));
  await screen.findByTestId("xrp-settings-continue");

  return view;
}

function getContinueButton() {
  return screen.getByTestId("xrp-settings-continue");
}

function getLimitInput() {
  return screen.getByTestId("xrp-limit-input");
}

async function openBalanceLimit(user: UserEvents) {
  await user.press(await screen.findByTestId("xrp-settings-limit-row"));
  await screen.findByTestId("xrp-limit-input");
}

async function replaceLimit(user: UserEvents, text: string) {
  await openBalanceLimit(user);
  await user.clear(getLimitInput());
  await user.type(getLimitInput(), text);
  await user.press(screen.getByTestId("xrp-limit-confirm"));
  await screen.findByTestId("xrp-settings-limit-row");
}

async function chooseRippling(user: UserEvents, option: "activated" | "deactivated") {
  await user.press(await screen.findByTestId("xrp-settings-rippling-row"));
  await user.press(await screen.findByTestId(`xrp-rippling-option-${option}`));
}

// The status of the last edit must be in before asserting on Continue
async function waitForBridgeToSettle(limit: string) {
  await waitFor(() => {
    const lastCall = mockAccountBridge.getTransactionStatus.mock.calls.at(-1);
    expect(lastCall?.[1].amount.toFixed()).toBe(limit);
  });
  await act(async () => {});
}

async function signFromEditDetails(user: UserEvents) {
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
  const device = await screen.findByTestId("device-item-mock", {}, { timeout: 10000 });
  await user.press(device);
}

function getSignedTransaction() {
  const calls = mockAccountBridge.signOperation.mock.calls as unknown as [
    { transaction: { amount: BigNumber; noRipple: boolean } },
  ][];

  return calls[0][0].transaction;
}

describe("XRP edit token flow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    mockTransactionStatus(mockAccountBridge, {});
    server.use(
      http.post(XRPL_TESTNET_NODE, () => {
        const node = { LedgerEntryType: "AccountRoot", Flags: 0 };

        return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
      }),
    );
  });

  describe("Entry", () => {
    it("opens Edit details from the Edit button of an IOU card", async () => {
      await renderEditDetails({
        xrpResources: STORED_RESOURCES,
      });

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/1\D?000 RLUSD/);
    });

    it("has no Edit button on an MPT card", async () => {
      renderManageAssets({ ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] });

      await screen.findByText("Multi Purpose Token");

      expect(screen.queryByTestId(`xrp-manage-asset-edit-${xrpMptToken.id}`)).toBeNull();
    });
  });

  describe("Edit details", () => {
    it("prefills the stored limit and rippling, with Continue disabled", async () => {
      await renderEditDetails({
        xrpResources: STORED_RESOURCES,
      });

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/1\D?000 RLUSD/);
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      await waitForBridgeToSettle("1000");
      expect(getContinueButton()).toBeDisabled();
    });

    it("shows the maximum limit as Maximum", async () => {
      await renderEditDetails({
        xrpResources: {
          isLocked: false,
          isRippling: false,
          limit: MAX_TRUST_LIMIT,
        },
      });

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent("Maximum");
    });

    it("shows no error on first open, though the bridge reports nothing changed", async () => {
      mockTransactionStatus(mockAccountBridge, {
        limit: makeNamedError("XrpTrustSetUnchanged"),
      });
      await renderEditDetails();

      await waitForBridgeToSettle("1000");

      expect(screen.queryByText("These settings are already in place")).toBeNull();
      expect(getContinueButton()).toBeDisabled();
    });

    it("hides the unchanged error while the status of a rippling change is pending", async () => {
      mockTransactionStatus(mockAccountBridge, {
        limit: makeNamedError("XrpTrustSetUnchanged"),
      });
      const { user } = await renderEditDetails();
      await waitForBridgeToSettle("1000");
      mockAccountBridge.getTransactionStatus.mockImplementation(() => new Promise<never>(() => {}));

      await chooseRippling(user, "activated");

      expect(screen.queryByText("These settings are already in place")).toBeNull();
      expect(getContinueButton()).toBeDisabled();
    });

    it("warns when the stored limit is 0 and keeps Continue disabled", async () => {
      await renderEditDetails({
        xrpResources: {
          isLocked: false,
          isRippling: false,
          limit: new BigNumber(0),
        },
      });

      expect(screen.getByTestId("xrp-current-limit-zero-warning")).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("does not claim a limit of 0 when the stored limit is unknown", async () => {
      await renderEditDetails({ xrpResources: { isLocked: false } });

      expect(screen.queryByTestId("xrp-current-limit-zero-warning")).toBeNull();
    });

    it("enables Continue once the limit is confirmed, and disables it back at the stored value", async () => {
      const { user } = await renderEditDetails();

      await replaceLimit(user, "2000");
      await waitForBridgeToSettle("2000");

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/2\D?000 RLUSD/);
      expect(getContinueButton()).toBeEnabled();

      await replaceLimit(user, "1000");
      await waitForBridgeToSettle("1000");

      expect(getContinueButton()).toBeDisabled();
    });

    it("shows the status error and keeps Continue disabled", async () => {
      const { user } = await renderEditDetails();
      mockTransactionStatus(mockAccountBridge, {
        limit: makeNamedError("XrpTrustLimitTooHigh"),
      });

      await replaceLimit(user, "2000");

      expect(await screen.findByText("The limit is above the maximum")).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("shows a bridge failure and keeps Continue disabled", async () => {
      const { user } = await renderEditDetails();
      mockAccountBridge.getTransactionStatus.mockRejectedValue(new Error("rpc down"));

      await replaceLimit(user, "2000");

      expect(await screen.findByText("rpc down")).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });
  });

  describe("Balance limit", () => {
    it("prefills the current limit", async () => {
      const { user } = await renderEditDetails();

      await openBalanceLimit(user);

      expect(getLimitInput()).toHaveDisplayValue("1,000 RLUSD");
    });

    it("groups the digits as they are typed and shows the ticker after them", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "1234567.5");

      expect(getLimitInput()).toHaveDisplayValue("1,234,567.5 RLUSD");
    });

    it("disables Confirm once the field is cleared with its clear button", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);

      await user.press(screen.getByLabelText("Clear input"));

      expect(getLimitInput()).toHaveDisplayValue("");
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("shows the limit-zero message and disables Confirm for a limit of 0", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "0");

      expect(await screen.findByText("The limit must be above 0")).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("warns and disables Confirm for a limit below the balance", async () => {
      const { user } = await renderEditDetails({ balance: new BigNumber(500) });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "100");

      expect(
        await screen.findByText(
          "Your balance (500 RLUSD) is above this limit. You won't be able to receive this token.",
        ),
      ).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("keeps Confirm enabled for a limit equal to the balance", async () => {
      const { user } = await renderEditDetails({ balance: new BigNumber(500) });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "500");

      expect(screen.getByTestId("xrp-limit-confirm")).toBeEnabled();
    });

    it("sets the maximum, shown as Maximum in the field and on Edit details", async () => {
      const { user } = await renderEditDetails({ balance: new BigNumber(500) });
      await openBalanceLimit(user);

      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      expect(getLimitInput()).toHaveDisplayValue("Maximum");

      await user.press(screen.getByTestId("xrp-limit-confirm"));

      expect(await screen.findByTestId("xrp-settings-limit-value")).toHaveTextContent("Maximum");
    });

    it("replaces the maximum by what is typed next", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);
      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      await user.type(getLimitInput(), "5");

      expect(getLimitInput()).toHaveDisplayValue("5 RLUSD");
      expect(screen.getByTestId("xrp-limit-set-maximum")).toBeEnabled();
    });
  });

  describe("Rippling sheet", () => {
    it("checks the current value, and choosing Activated updates the row and enables Continue", async () => {
      const { user } = await renderEditDetails();

      await user.press(await screen.findByTestId("xrp-settings-rippling-row"));
      expect(await screen.findByTestId("xrp-rippling-option-deactivated")).toBeVisible();
      expect(screen.queryByTestId("xrp-rippling-warning")).toBeNull();
      await user.press(screen.getByTestId("xrp-rippling-option-activated"));

      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      expect(screen.getByTestId("xrp-rippling-warning")).toBeVisible();
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
    });
  });

  describe("Signing", () => {
    it("signs a changeTrust edit without a sub account, then shows success and the pending row", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await chooseRippling(user, "activated");

      await signFromEditDetails(user);

      expect(
        await screen.findByText("Token settings updated", {}, { timeout: 15000 }),
      ).toBeVisible();
      expect(getSignedTransaction()).toMatchObject({
        mode: "changeTrust",
        assetReference: xrpIouToken.tokenIdentifier,
        assetOwner: xrpIouToken.contractAddress,
        noRipple: false,
      });
      expect(getSignedTransaction().amount.toFixed()).toBe("2000");
      expect(getSignedTransaction()).not.toHaveProperty("subAccountId");

      await user.press(screen.getByText("View details"));

      expect(await screen.findByTestId("operation-details")).toBeVisible();
    });

    it("signs noRipple when rippling is deactivated", async () => {
      const { user } = await renderEditDetails({
        xrpResources: STORED_RESOURCES,
      });
      await chooseRippling(user, "deactivated");

      await signFromEditDetails(user);

      await screen.findByText("Token settings updated", {}, { timeout: 15000 });
      expect(getSignedTransaction().noRipple).toBe(true);
      expect(getSignedTransaction().amount.toFixed()).toBe("1000");
    });

    it("returns to the Manage assets list from the success screen", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await signFromEditDetails(user);
      await screen.findByText("Token settings updated", {}, { timeout: 15000 });

      await user.press(screen.getByText("Close"));

      expect(await screen.findByText("Manage assets")).toBeVisible();
    });

    it("shows the signed limit and rippling on the Manage assets card right after success", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await chooseRippling(user, "activated");
      await signFromEditDetails(user);
      await screen.findByText("Token settings updated", {}, { timeout: 15000 });

      await user.press(screen.getByText("Close"));

      expect(await screen.findByText(/2\D?000 RLUSD/)).toBeVisible();
      expect(screen.getByText("Activated")).toBeVisible();
    });

    it("keeps the entered values when going back from the device step", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await chooseRippling(user, "activated");
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      await screen.findByTestId("device-item-mock", {}, { timeout: 10000 });

      await user.press(screen.getAllByTestId("navigation-header-back-button").at(-1)!);

      expect(await screen.findByTestId("xrp-settings-limit-value")).toHaveTextContent(
        /2\D?000 RLUSD/,
      );
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
    });

    it("lands on the error screen with Retry when signing fails", async () => {
      mockAccountBridge.signOperation.mockImplementationOnce(
        () =>
          new Observable<SignOperationEvent>(subscriber => {
            subscriber.next({ type: "device-signature-requested" });
            subscriber.error(new Error("UserRefusedOnDevice"));
          }),
      );
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");

      await signFromEditDetails(user);

      await waitFor(() => expect(screen.getByText("Retry")).toBeVisible(), { timeout: 15000 });
    });

    it("shows the broadcast-error notice when the signed transaction fails to broadcast", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("tefPAST_SEQ"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");

      await signFromEditDetails(user);

      expect(
        await screen.findByText("Transaction Broadcast Unsuccessfull", {}, { timeout: 15000 }),
      ).toBeVisible();
    });
  });
});
