import React from "react";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { updateAccount } from "~/actions/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import { XRP_ACCOUNT, overrideWithAccounts } from "../../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";
import { makeMockAccountBridge } from "../../__mocks__/bridge.mock";

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

const OuterStack = createNativeStackNavigator();

function makeNamedError(name: string, fields: Record<string, string> = {}) {
  return Object.assign(new Error(name), { name, ...fields });
}

function mockStatus(errors: Record<string, Error>, warnings: Record<string, Error> = {}) {
  mockAccountBridge.getTransactionStatus.mockResolvedValue({
    errors,
    warnings,
    estimatedFees: new BigNumber(12),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(12),
  });
}

function AddTokenFlowHarness() {
  return (
    <OuterStack.Navigator screenOptions={{ headerShown: false }}>
      <OuterStack.Screen name={NavigatorName.XrpAddTokenFlow} component={component} />
    </OuterStack.Navigator>
  );
}

function renderAt(
  screenName: ScreenName.XrpAddTokenSettings | ScreenName.XrpAddTokenReview,
  token: TokenCurrency,
) {
  return render(<AddTokenFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.XrpAddTokenFlow,
          state: {
            index: 0,
            routes: [{ name: screenName, params: { token, accountId: XRP_ACCOUNT.id } }],
          },
        },
      ],
    },
    overrideInitialState: overrideWithAccounts(XRP_ACCOUNT),
  });
}

function renderSettings(token: TokenCurrency) {
  return renderAt(ScreenName.XrpAddTokenSettings, token);
}

function renderReview(token: TokenCurrency) {
  return renderAt(ScreenName.XrpAddTokenReview, token);
}

function getContinueButton() {
  return screen.getByTestId("xrp-review-continue");
}

function getSettingsContinueButton() {
  return screen.getByTestId("xrp-settings-continue");
}

type UserEvents = ReturnType<typeof render>["user"];

async function continueFromSettings(user: UserEvents) {
  await waitFor(() => expect(getSettingsContinueButton()).toBeEnabled());
  await user.press(getSettingsContinueButton());
}

async function signFromReview(user: UserEvents) {
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
  await user.press(await screen.findByTestId("device-item-mock", {}, { timeout: 10000 }));
}

function getSignedTransaction() {
  const calls = mockAccountBridge.signOperation.mock.calls as unknown as [
    { transaction: { amount: BigNumber } },
  ][];

  return calls[0][0].transaction;
}

describe("XRP AddTokenFlow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    mockStatus({});
  });

  it("signs an IOU opt-in at the max trust limit and shows the success screen", async () => {
    const { user } = renderSettings(xrpIouToken);

    const maxSwitch = await screen.findByTestId("xrp-limit-max-switch");
    await waitFor(() => expect(maxSwitch).toBeEnabled());
    await user.press(maxSwitch);
    await continueFromSettings(user);

    expect(await screen.findByText("Trust Line (IOU)")).toBeVisible();
    expect(screen.getByText(xrpIouToken.contractAddress)).toBeVisible();
    expect(screen.getByText("Maximum")).toBeVisible();
    await signFromReview(user);

    expect(
      await screen.findByText(`${xrpIouToken.name} added`, {}, { timeout: 15000 }),
    ).toBeVisible();
    expect(getSignedTransaction()).toMatchObject({
      mode: "changeTrust",
      amount: MAX_TRUST_LIMIT,
      noRipple: true,
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
    });
  });

  it("signs an IOU opt-in at a typed trust limit with thousands", async () => {
    const { user } = renderSettings(xrpIouToken);

    await user.type(await screen.findByTestId("xrp-limit-input"), "1500");
    await continueFromSettings(user);
    await screen.findByText("Trust Line (IOU)");
    await signFromReview(user);
    await screen.findByText(`${xrpIouToken.name} added`, {}, { timeout: 15000 });

    expect(getSignedTransaction().amount.toFixed()).toBe("1500");
  });

  it("shows the max trust limit in its info drawer", async () => {
    const { user } = renderSettings(xrpIouToken);

    await user.press(await screen.findByTestId("xrp-max-limit-info"));

    expect(await screen.findByText(/The maximum permitted trust limit is/)).toBeVisible();
  });

  it("signs an IOU opt-in with Rippling on, after its warning", async () => {
    const { user } = renderSettings(xrpIouToken);

    expect(await screen.findByTestId("xrp-rippling-switch")).toBeVisible();
    expect(screen.queryByTestId("xrp-rippling-warning")).toBeNull();

    await user.press(screen.getByTestId("xrp-rippling-switch"));

    expect(screen.getByTestId("xrp-rippling-warning")).toBeVisible();

    await user.type(screen.getByTestId("xrp-limit-input"), "100");
    await continueFromSettings(user);

    expect(await screen.findByText("On")).toBeVisible();
    await signFromReview(user);
    await screen.findByText(`${xrpIouToken.name} added`, {}, { timeout: 15000 });

    expect(getSignedTransaction()).toMatchObject({ noRipple: false });
  });

  it("shows no trust limit for an MPT", async () => {
    renderReview(xrpMptToken);

    expect(await screen.findByText("Multi purpose token")).toBeVisible();
    expect(screen.queryByText("Trust limit")).toBeNull();
  });

  it("blocks a limit of 0 with its own message", async () => {
    mockStatus({ amount: makeNamedError("XrpTrustLimitZero") });
    const { user } = renderSettings(xrpIouToken);

    await user.type(await screen.findByTestId("xrp-limit-input"), "0");

    expect(await screen.findByText("The trust limit must be above 0.")).toBeVisible();
    expect(getSettingsContinueButton()).toBeDisabled();
  });

  it("blocks when the account lacks XRP and offers to receive", async () => {
    mockStatus({
      amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "1.2 XRP" }),
    });
    renderReview(xrpMptToken);

    expect(
      await screen.findByText("You need at least 1.2 XRP available to add this token."),
    ).toBeVisible();
    expect(screen.getByTestId("xrp-receive")).toBeVisible();
    expect(getContinueButton()).toBeDisabled();
  });

  it("unblocks once the account gets funded", async () => {
    mockStatus({
      amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "1.2 XRP" }),
    });
    const { store } = renderReview(xrpMptToken);
    await screen.findByText("You need at least 1.2 XRP available to add this token.");

    mockStatus({});
    await act(async () => {
      store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, balance: new BigNumber(100_000_000) }));
    });

    await waitFor(() => expect(getContinueButton()).toBeEnabled());
  });

  it("blocks on any other coin-xrp error and shows its string", async () => {
    mockStatus({ transaction: makeNamedError("XrpTokenOptInRefused") });
    renderReview(xrpMptToken);

    expect(await screen.findByText("The issuer refused this request")).toBeVisible();
    expect(getContinueButton()).toBeDisabled();
  });

  it("shows the locked amount warning", async () => {
    mockStatus({}, { reserve: makeNamedError("XrpReserveIncrease", { amount: "0.2 XRP" }) });
    renderReview(xrpMptToken);

    expect(
      await screen.findByText("0.2 XRP will be locked on your account while this token is added."),
    ).toBeVisible();
  });

  it("lands on the error screen when signing fails", async () => {
    mockAccountBridge.signOperation.mockImplementationOnce(
      () =>
        new Observable<SignOperationEvent>(subscriber => {
          subscriber.next({ type: "device-signature-requested" });
          subscriber.error(new Error("UserRefusedOnDevice"));
        }),
    );
    const { user } = renderReview(xrpMptToken);

    await waitFor(() => expect(getContinueButton()).toBeEnabled());
    await user.press(getContinueButton());
    await user.press(await screen.findByTestId("device-item-mock", {}, { timeout: 10000 }));

    await waitFor(() => expect(screen.getByText("Retry")).toBeVisible(), { timeout: 15000 });
  });
});
