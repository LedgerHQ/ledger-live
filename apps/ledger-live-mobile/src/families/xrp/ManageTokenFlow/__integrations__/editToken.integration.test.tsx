import React from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { BridgeSyncContext } from "@ledgerhq/live-common/bridge/react/index";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { HttpResponse, http, server } from "@tests/server";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { updateAccount } from "~/actions/accounts";
import { NavigatorName, ScreenName } from "~/const";
import LocaleProvider, { i18n } from "~/context/Locale";
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

type ExecutorProps = {
  sourceFlow: string;
  intent: {
    input: { transaction: { amount: BigNumber; noRipple: boolean } };
    onResult: (signedOperation: object) => void;
  };
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
};

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

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

const EDIT_BUTTON = `xrp-manage-asset-edit-${xrpIouToken.id}`;

// The sheet queue opens the next sheet 600 ms after the previous one closes, as no dismiss animation ends in jest
const SHEET_TIMEOUT = 3000;

const ZERO_AMOUNT = new BigNumber(0);

const SIGNED_OPERATION = {
  signature: "sig",
  operation: {
    id: "op-edit",
    hash: "0xedit",
    type: "OPT_IN",
    value: new BigNumber(0),
    fee: new BigNumber(12),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: XRP_ACCOUNT.id,
    date: new Date(),
    extra: {},
  },
};

const TOKEN_BALANCE = new BigNumber(500);

const TWO_DECIMALS_TOKEN = {
  ...xrpIouToken,
  units: [{ name: "RLUSD", code: "RLUSD", magnitude: 2 }],
};

const STORED_RESOURCES = {
  isLocked: false,
  isRippling: true,
  limit: new BigNumber(1000),
};

const OuterStack = createNativeStackNavigator();

type UserEvents = ReturnType<typeof render>["user"];

type BroadcastedOperation = Awaited<ReturnType<typeof mockAccountBridge.broadcast>>;

function OperationDetailsStub(props: Readonly<{ route: { params?: object } }>) {
  const { operation } = props.route.params as { operation: { type: string } };

  return <Text testID="operation-details">{operation.type}</Text>;
}

const mockSync = jest.fn();

function ManageTokenFlowHarness() {
  return (
    <BridgeSyncContext.Provider value={mockSync}>
      <LocaleProvider>
        <OuterStack.Navigator screenOptions={{ headerShown: false }}>
          <OuterStack.Screen name={NavigatorName.XrpManageTokenFlow} component={component} />
          <OuterStack.Screen name={ScreenName.OperationDetails} component={OperationDetailsStub} />
        </OuterStack.Navigator>
      </LocaleProvider>
    </BridgeSyncContext.Provider>
  );
}

function makeAccountWithToken(overrides: Partial<XrpTokenAccount>): Account {
  const tokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: ZERO_AMOUNT, ...overrides };

  return { ...XRP_ACCOUNT, subAccounts: [tokenAccount] };
}

function renderManageAssets(account: Account, language = "en") {
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
    overrideInitialState: state => {
      const stateWithAccounts = overrideWithAccounts(account)(state);

      return { ...stateWithAccounts, settings: { ...stateWithAccounts.settings, language } };
    },
  });
}

async function renderEditDetails(overrides: Partial<XrpTokenAccount> = {}, language = "en") {
  const view = renderManageAssets(makeAccountWithToken(overrides), language);

  const editButton = await screen.findByTestId(EDIT_BUTTON);
  await view.user.press(editButton);
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
  const limitRow = await screen.findByTestId("xrp-settings-limit-row");
  await user.press(limitRow);
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
  const ripplingRow = await screen.findByTestId("xrp-settings-rippling-row");
  await user.press(ripplingRow);

  const ripplingOption = await screen.findByTestId(`xrp-rippling-option-${option}`);
  await user.press(ripplingOption);
}

async function syncTokenResources(
  store: ReturnType<typeof render>["store"],
  xrpResources: XrpTokenAccount["xrpResources"],
) {
  const { subAccounts } = makeAccountWithToken({ xrpResources });

  await act(async () => {
    store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, subAccounts }));
  });
}

async function syncTokenRemoval(store: ReturnType<typeof render>["store"]) {
  await act(async () => {
    store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, subAccounts: [] }));
  });
}

async function waitForBridgeToSettle(limit: string) {
  await waitFor(() => {
    const lastCall = mockAccountBridge.getTransactionStatus.mock.calls.at(-1);
    expect(lastCall?.[1].amount.toFixed()).toBe(limit);
  });
  await act(async () => {});
}

async function continueToDevice(user: UserEvents) {
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
  await screen.findByTestId("device-intent-executor");
}

function getExecutorProps(): ExecutorProps {
  invariant(mockExecutorProps, "The device intent executor is not rendered");

  return mockExecutorProps;
}

// Like the real job: the result, then the last state, then the end of the job
async function signOnDevice() {
  const { intent, onIntentJobStateChanged, onIntentJobComplete } = getExecutorProps();
  act(() => {
    intent.onResult(SIGNED_OPERATION);
    onIntentJobStateChanged({ type: "signed", signedOperation: SIGNED_OPERATION });
  });
  await act(async () => onIntentJobComplete());
}

async function signFromEditDetails(user: UserEvents) {
  await continueToDevice(user);
  await signOnDevice();
}

function makePendingBroadcast() {
  let finish!: (operation: BroadcastedOperation) => void;
  const result = new Promise<BroadcastedOperation>(resolve => {
    finish = resolve;
  });

  return { result, finish };
}

function getSignedTransaction() {
  return getExecutorProps().intent.input.transaction;
}

describe("XRP edit token flow (integration)", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
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
      await renderEditDetails({ xrpResources: STORED_RESOURCES });

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
      await renderEditDetails({ xrpResources: STORED_RESOURCES });

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
          limit: ZERO_AMOUNT,
        },
      });

      expect(screen.getByTestId("xrp-current-limit-zero-warning")).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("shows no limit error on first open when the stored limit is 0", async () => {
      mockTransactionStatus(mockAccountBridge, { amount: makeNamedError("XrpTrustLimitZero") });
      await renderEditDetails({
        xrpResources: {
          isLocked: false,
          isRippling: false,
          limit: ZERO_AMOUNT,
        },
      });

      await waitForBridgeToSettle("0");

      expect(screen.getByTestId("xrp-current-limit-zero-warning")).toBeVisible();
      expect(screen.queryByText("The limit must be above 0")).toBeNull();
    });

    it("does not claim a limit of 0 when the stored limit is unknown", async () => {
      mockTransactionStatus(mockAccountBridge, { amount: makeNamedError("XrpTrustLimitZero") });
      await renderEditDetails({ xrpResources: { isLocked: false } });

      await waitForBridgeToSettle("0");

      expect(screen.queryByTestId("xrp-current-limit-zero-warning")).toBeNull();
      expect(screen.queryByText("The limit must be above 0")).toBeNull();
    });

    it("shows the limit in the language of the app", async () => {
      await renderEditDetails({ xrpResources: STORED_RESOURCES }, "de");

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent("1.000 RLUSD");
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

      const statusMessage = await screen.findByText("The limit is above the maximum");

      expect(statusMessage).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("shows the title of a status error that has no description, without the generic text", async () => {
      const { user } = await renderEditDetails();
      mockTransactionStatus(mockAccountBridge, {
        amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "0.00001 XRP" }),
      });

      await replaceLimit(user, "2000");

      const statusMessage = await screen.findByText("Balance cannot be below 0.00001 XRP");

      expect(statusMessage).toBeVisible();
      expect(screen.queryByText(/Something went wrong/)).toBeNull();
    });

    it("shows a bridge failure and keeps Continue disabled", async () => {
      const { user } = await renderEditDetails();
      mockAccountBridge.getTransactionStatus.mockRejectedValue(new Error("rpc down"));

      await replaceLimit(user, "2000");

      const failureMessage = await screen.findByText("rpc down");

      expect(failureMessage).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("checks the status against the account again when a sync changes it", async () => {
      const { user, store } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await waitForBridgeToSettle("2000");
      const syncedBalance = new BigNumber(1);

      await act(async () => {
        store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, balance: syncedBalance }));
      });

      await waitFor(() => {
        const lastCall = mockAccountBridge.getTransactionStatus.mock.calls.at(-1);
        expect(lastCall?.[0].balance).toEqual(syncedBalance);
      });
    });

    it("follows the synced values when nothing was edited, and keeps Continue disabled", async () => {
      const { store } = await renderEditDetails();

      await syncTokenResources(store, {
        isLocked: false,
        isRippling: true,
        limit: new BigNumber(2000),
      });

      await waitFor(() => {
        expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/2\D?000 RLUSD/);
      });
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      expect(getContinueButton()).toBeDisabled();
    });

    it("keeps the edited rippling and follows the synced limit, which was not edited", async () => {
      const { user, store } = await renderEditDetails();
      await chooseRippling(user, "activated");

      await syncTokenResources(store, {
        isLocked: false,
        isRippling: false,
        limit: new BigNumber(2000),
      });

      await waitFor(() => {
        expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/2\D?000 RLUSD/);
      });
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      expect(getContinueButton()).toBeEnabled();
    });

    it("keeps the edited limit and follows the synced rippling, which was not edited", async () => {
      const { user, store } = await renderEditDetails();
      await replaceLimit(user, "3000");

      await syncTokenResources(store, {
        isLocked: false,
        isRippling: true,
        limit: new BigNumber(1000),
      });

      await waitFor(() => {
        expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      });
      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/3\D?000 RLUSD/);
    });

    it("returns to Manage assets when a sync leaves the token without its trust line state", async () => {
      const { store } = await renderEditDetails();

      await syncTokenResources(store, undefined);

      expect(await screen.findByText("This account has no tokens yet.")).toBeVisible();
      expect(screen.queryByTestId("xrp-settings-continue")).toBeNull();
    });

    it("returns to Manage assets when a sync removes the trust line being edited", async () => {
      const { store } = await renderEditDetails();

      await syncTokenRemoval(store);

      expect(await screen.findByText("This account has no tokens yet.")).toBeVisible();
      expect(screen.queryByTestId("xrp-settings-continue")).toBeNull();
    });
  });

  describe("Balance limit", () => {
    it("prefills the current limit and shows the ticker beside it", async () => {
      const { user } = await renderEditDetails();

      await openBalanceLimit(user);

      expect(getLimitInput()).toHaveDisplayValue("1000");
      expect(screen.getByText("RLUSD")).toBeVisible();
    });

    it("returns to Manage assets when a sync leaves the token without its trust line state while its limit is edited", async () => {
      const { user, store } = await renderEditDetails();
      await openBalanceLimit(user);

      await syncTokenResources(store, undefined);

      expect(await screen.findByText("This account has no tokens yet.")).toBeVisible();
      expect(screen.queryByTestId("xrp-limit-input")).toBeNull();
    });

    it("returns to Manage assets when a sync removes the trust line while its limit is edited", async () => {
      const { user, store } = await renderEditDetails();
      await openBalanceLimit(user);

      await syncTokenRemoval(store);

      expect(await screen.findByText("This account has no tokens yet.")).toBeVisible();
      expect(screen.queryByTestId("xrp-limit-input")).toBeNull();
    });

    it("reads a comma typed as the decimal point in an English app", async () => {
      const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "1,5");

      expect(getLimitInput()).toHaveDisplayValue("1.5");
    });

    it("reads a pasted comma before 2 digits as the decimal point in an English app", async () => {
      const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.paste(getLimitInput(), "1,50");

      expect(getLimitInput()).toHaveDisplayValue("1.50");
    });

    it.each(["1,234,567", "1.234.567", "1,234.56"])(
      "ignores a pasted grouped number such as %s instead of reading part of it",
      async pasted => {
        const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
        await openBalanceLimit(user);

        await user.clear(getLimitInput());
        await user.paste(getLimitInput(), pasted);

        expect(getLimitInput()).toHaveDisplayValue("");
        expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
      },
    );

    it("keeps the limit already typed when a grouped number is pasted over it", async () => {
      const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "1.5");
      await user.paste(getLimitInput(), "1,234,567");

      expect(getLimitInput()).toHaveDisplayValue("1.5");
    });

    it.each(["1e3", "1e-3", "-5", "5a"])(
      "ignores a pasted %s instead of reading its digits",
      async pasted => {
        const { user } = await renderEditDetails();
        await openBalanceLimit(user);

        await user.clear(getLimitInput());
        fireEvent.changeText(getLimitInput(), pasted);

        expect(getLimitInput()).toHaveDisplayValue("");
        expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
      },
    );

    it("keeps the limit already typed when text with other characters replaces it", async () => {
      const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "1.5");
      fireEvent.changeText(getLimitInput(), "1.5e3");

      expect(getLimitInput()).toHaveDisplayValue("1.5");
    });

    it("keeps no more decimals than the token has", async () => {
      const { user } = await renderEditDetails({ token: TWO_DECIMALS_TOKEN });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "1.005");

      expect(getLimitInput()).toHaveDisplayValue("1.00");
    });

    it("disables Confirm once the field is cleared", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);

      await user.clear(getLimitInput());

      expect(getLimitInput()).toHaveDisplayValue("");
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("shows the limit-zero message and disables Confirm for a limit of 0", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "0");

      const limitZeroMessage = await screen.findByText("The limit must be above 0");

      expect(limitZeroMessage).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("warns and disables Confirm for a limit below the balance", async () => {
      const { user } = await renderEditDetails({ balance: TOKEN_BALANCE });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "100");

      const belowBalanceMessage = await screen.findByText(
        "Your balance (500 RLUSD) is above this limit. You won't be able to receive this token.",
      );

      expect(belowBalanceMessage).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("shows the balance in the language of the app when the limit is below it", async () => {
      const { user } = await renderEditDetails({ balance: new BigNumber(5000) }, "de");
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "100");

      const belowBalanceMessage = await screen.findByText(/^Your balance \(5\.000 RLUSD\)/);

      expect(belowBalanceMessage).toBeVisible();
    });

    it("keeps Confirm enabled for a limit equal to the balance", async () => {
      const { user } = await renderEditDetails({ balance: TOKEN_BALANCE });
      await openBalanceLimit(user);

      await user.clear(getLimitInput());
      await user.type(getLimitInput(), "500");

      expect(screen.getByTestId("xrp-limit-confirm")).toBeEnabled();
    });

    it("sets the maximum, shown as Maximum in the field and on Edit details", async () => {
      const { user } = await renderEditDetails({ balance: TOKEN_BALANCE });
      await openBalanceLimit(user);

      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      expect(getLimitInput()).toHaveDisplayValue("Maximum");

      await user.press(screen.getByTestId("xrp-limit-confirm"));

      const limitValue = await screen.findByTestId("xrp-settings-limit-value");

      expect(limitValue).toHaveTextContent("Maximum");
    });

    it("replaces the maximum by what is typed next", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);
      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      await user.type(getLimitInput(), "5");

      expect(getLimitInput()).toHaveDisplayValue("5");
      expect(screen.getByTestId("xrp-limit-set-maximum")).toBeEnabled();
    });

    it("replaces the maximum when the whole text is replaced at once", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);
      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      fireEvent.changeText(getLimitInput(), "5");

      expect(getLimitInput()).toHaveDisplayValue("5");
      expect(screen.getByTestId("xrp-limit-confirm")).toBeEnabled();
    });

    it("leaves an empty field when the label of the maximum is partly deleted", async () => {
      const { user } = await renderEditDetails();
      await openBalanceLimit(user);
      await user.press(screen.getByTestId("xrp-limit-set-maximum"));

      fireEvent.changeText(getLimitInput(), "Maximu");

      expect(getLimitInput()).toHaveDisplayValue("");
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
      expect(screen.getByTestId("xrp-limit-set-maximum")).toBeEnabled();
    });
  });

  describe("Rippling sheet", () => {
    it("checks the current value, and choosing Activated updates the row and enables Continue", async () => {
      const { user } = await renderEditDetails();

      const ripplingRow = await screen.findByTestId("xrp-settings-rippling-row");
      await user.press(ripplingRow);
      const deactivatedOption = await screen.findByTestId("xrp-rippling-option-deactivated");
      expect(deactivatedOption).toBeVisible();
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

      const successTitle = await screen.findByText(
        "Token settings updated",
        {},
        { timeout: SHEET_TIMEOUT },
      );
      const signedTransaction = getSignedTransaction();

      expect(successTitle).toBeVisible();
      expect(signedTransaction).toMatchObject({
        mode: "changeTrust",
        assetReference: xrpIouToken.tokenIdentifier,
        assetOwner: xrpIouToken.contractAddress,
        noRipple: false,
      });
      expect(signedTransaction.amount.toFixed()).toBe("2000");
      expect(signedTransaction).not.toHaveProperty("subAccountId");

      await user.press(screen.getByText("View details"));

      const operationDetails = await screen.findByTestId("operation-details");

      expect(operationDetails).toBeVisible();
    });

    it("signs noRipple when rippling is deactivated", async () => {
      const { user } = await renderEditDetails({ xrpResources: STORED_RESOURCES });
      await chooseRippling(user, "deactivated");

      await signFromEditDetails(user);

      await screen.findByText("Token settings updated", {}, { timeout: SHEET_TIMEOUT });
      const signedTransaction = getSignedTransaction();

      expect(signedTransaction.noRipple).toBe(true);
      expect(signedTransaction.amount.toFixed()).toBe("1000");
    });

    it("returns to the Manage assets list from the success screen", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await signFromEditDetails(user);
      await screen.findByText("Token settings updated", {}, { timeout: SHEET_TIMEOUT });

      await user.press(screen.getByText("Close"));

      await waitFor(() => expect(screen.queryByTestId("xrp-settings-continue")).toBeNull());
      const manageAssetsTitle = await screen.findByText("Manage assets");

      expect(manageAssetsTitle).toBeVisible();
    });

    it("syncs the account once the edit is broadcast, not before", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await continueToDevice(user);

      expect(mockSync).not.toHaveBeenCalled();

      await signOnDevice();
      await screen.findByText("Token settings updated", {}, { timeout: SHEET_TIMEOUT });

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: XRP_ACCOUNT.id,
        reason: "transaction-flow-confirmation",
      });
    });

    it("signs on the device from the Edit details screen, without a device selection screen", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");

      await continueToDevice(user);

      expect(getExecutorProps().sourceFlow).toBe("manage_assets");
      expect(screen.queryByTestId("device-item-mock")).toBeNull();
      expect(screen.getByTestId("xrp-settings-continue")).toBeVisible();
    });

    it("disables Continue during the device step and enables it again once cancelled", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");

      await continueToDevice(user);

      expect(getContinueButton()).toBeDisabled();

      await act(async () => getExecutorProps().onUserCancel());

      await waitFor(() => expect(getContinueButton()).toBeEnabled());
    });

    it("keeps the entered values when the device step is cancelled", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await chooseRippling(user, "activated");
      await continueToDevice(user);

      await act(async () => getExecutorProps().onUserCancel());

      await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/2\D?000 RLUSD/);
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
    });

    it("tracks a signing error by name", async () => {
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await continueToDevice(user);

      act(() => {
        getExecutorProps().onIntentJobStateChanged({
          type: "error",
          error: makeNamedError("TransportStatusError"),
          retry: jest.fn(),
        });
      });

      const trackCalls = jest.mocked(track).mock.calls;
      const errorEvents = trackCalls.filter(([event]) => event === "error_displayed");
      expect(errorEvents).toEqual([
        [
          "error_displayed",
          {
            action: "edit",
            currency: XRP_ACCOUNT.currency.id,
            tokenType: "iou",
            step: "signature",
            message_id: "TransportStatusError",
            message_type: "error",
          },
        ],
      ]);
    });

    it("keeps the flow open when the device sheet is closed during the broadcast", async () => {
      const pendingBroadcast = makePendingBroadcast();
      mockAccountBridge.broadcast.mockReturnValueOnce(pendingBroadcast.result);
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await continueToDevice(user);
      await signOnDevice();

      await act(async () => getExecutorProps().onUserCancel());

      expect(getContinueButton()).toBeDisabled();
      await act(async () => pendingBroadcast.finish(SIGNED_OPERATION.operation));
      const successTitle = await screen.findByText(
        "Token settings updated",
        {},
        { timeout: SHEET_TIMEOUT },
      );

      expect(successTitle).toBeVisible();
    });

    it("shows the broadcast-error notice when the signed transaction fails to broadcast", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("tefPAST_SEQ"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");

      await signFromEditDetails(user);

      const broadcastNotice = await screen.findByText(
        "Transaction Broadcast Unsuccessfull",
        {},
        { timeout: SHEET_TIMEOUT },
      );

      expect(broadcastNotice).toBeVisible();
      expect(screen.getByTestId("xrp-edit-token-broadcast-error")).toBeVisible();
    });

    it("offers no Retry after a failed broadcast, as the transaction may have gone through", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("tefPAST_SEQ"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await signFromEditDetails(user);

      await screen.findByTestId("xrp-edit-token-broadcast-error", {}, { timeout: SHEET_TIMEOUT });

      expect(screen.queryByTestId("xrp-edit-token-retry")).toBeNull();
    });

    it("signs again on Retry after the device could not be prepared", async () => {
      jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("No device"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      const retryButton = await screen.findByTestId(
        "xrp-edit-token-retry",
        {},
        { timeout: SHEET_TIMEOUT },
      );

      await user.press(retryButton);

      expect(await screen.findByTestId("device-intent-executor")).toBeVisible();
    });

    it("closes the sheet instead of signing on Retry when a sync made the transaction invalid", async () => {
      jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("No device"));
      const { user, store } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      const retryButton = await screen.findByTestId(
        "xrp-edit-token-retry",
        {},
        { timeout: SHEET_TIMEOUT },
      );
      const syncedBalance = new BigNumber(1);
      mockTransactionStatus(mockAccountBridge, {
        limit: makeNamedError("XrpTrustLimitTooHigh"),
      });
      await act(async () => {
        store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, balance: syncedBalance }));
      });
      await waitFor(() => {
        const lastCall = mockAccountBridge.getTransactionStatus.mock.calls.at(-1);
        expect(lastCall?.[0].balance).toEqual(syncedBalance);
      });
      jest.mocked(buildDeviceInitializationInput).mockClear();

      await user.press(retryButton);

      expect(await screen.findByText("The limit is above the maximum")).toBeVisible();
      expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
      expect(screen.queryByTestId("device-intent-executor")).toBeNull();
      expect(getContinueButton()).toBeDisabled();
    });

    it("builds one device intent when Retry is pressed twice", async () => {
      jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("No device"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      const retryButton = await screen.findByTestId(
        "xrp-edit-token-retry",
        {},
        { timeout: SHEET_TIMEOUT },
      );
      jest.mocked(buildDeviceInitializationInput).mockClear();

      await user.press(retryButton);
      await user.press(retryButton);

      expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
    });

    it("stays on Edit details when the failure sheet is closed, and signs again on Continue", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("tefPAST_SEQ"));
      const { user } = await renderEditDetails();
      await replaceLimit(user, "2000");
      await signFromEditDetails(user);
      await screen.findByTestId("xrp-edit-token-error", {}, { timeout: SHEET_TIMEOUT });

      await user.press(screen.getByText("Close"));

      await continueToDevice(user);

      expect(screen.getByTestId("device-intent-executor")).toBeVisible();
    });
  });
});
