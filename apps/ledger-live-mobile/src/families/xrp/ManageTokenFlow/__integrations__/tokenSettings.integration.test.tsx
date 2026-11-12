import React from "react";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../../__mocks__/account.mock";
import {
  makeMockAccountBridge,
  makeNamedError,
  mockTransactionStatus,
} from "../../__mocks__/bridge.mock";
import { xrpIouToken } from "../../__mocks__/currency.mock";

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

jest.mock("@ledgerhq/live-common/families/xrp/logicPublic", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/logicPublic"),
    getMaxTrustLimitForToken: jest.fn(),
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

const MAX_LIMIT = new BigNumber("1000000000");

const OuterStack = createNativeStackNavigator();

type UserEvents = ReturnType<typeof render>["user"];

function makeAccountWithToken(overrides: Partial<XrpTokenAccount>): {
  account: Account;
  tokenAccount: XrpTokenAccount;
} {
  const tokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, ...overrides };

  return { account: { ...XRP_ACCOUNT, subAccounts: [tokenAccount] }, tokenAccount };
}

function ManageTokenFlowHarness() {
  return (
    <OuterStack.Navigator screenOptions={{ headerShown: false }}>
      <OuterStack.Screen name={NavigatorName.XrpManageTokenFlow} component={component} />
    </OuterStack.Navigator>
  );
}

function renderFlowAt(
  screenName: ScreenName.XrpManageTokenManage | ScreenName.XrpManageTokenSettings,
  overrides: Partial<XrpTokenAccount> = {},
) {
  const { account, tokenAccount } = makeAccountWithToken(overrides);

  return render(<ManageTokenFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.XrpManageTokenFlow,
          state: {
            index: 0,
            routes: [
              {
                name: screenName,
                params: { accountId: tokenAccount.id, parentId: account.id },
              },
            ],
          },
        },
      ],
    },
    overrideInitialState: overrideWithAccounts(account),
  });
}

function renderTokenSettings(overrides: Partial<XrpTokenAccount> = {}) {
  return renderFlowAt(ScreenName.XrpManageTokenSettings, overrides);
}

function getReviewButton() {
  return screen.getByTestId("xrp-settings-review");
}

async function replaceLimit(user: UserEvents, text: string) {
  const limitInput = await screen.findByTestId("xrp-limit-input");
  await user.clear(limitInput);
  await user.type(limitInput, text);
}

// Review also waits on the bridge: assert its state only after the status of the last limit is in
async function waitForBridgeToSettle(limit: string) {
  await waitFor(() => {
    const lastCall = mockAccountBridge.getTransactionStatus.mock.calls.at(-1);
    expect(lastCall?.[1].amount.toFixed()).toBe(limit);
  });
  await act(async () => {});
}

async function openReviewWithLimit(user: UserEvents, limit: string) {
  await replaceLimit(user, limit);
  await waitFor(() => expect(getReviewButton()).toBeEnabled());
  await user.press(getReviewButton());
}

async function signFromReview(user: UserEvents) {
  const continueButton = await screen.findByTestId("xrp-manage-review-continue");
  await waitFor(() => expect(continueButton).toBeEnabled());
  await user.press(continueButton);
  const device = await screen.findByTestId("device-item-mock", {}, { timeout: 10000 });
  await user.press(device);
}

function getSignedTransaction() {
  const calls = mockAccountBridge.signOperation.mock.calls as unknown as [
    { transaction: { amount: BigNumber } },
  ][];

  return calls[0][0].transaction;
}

describe("XRP ManageTokenFlow, Token settings (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou"]);
    jest.mocked(getMaxTrustLimitForToken).mockReturnValue(MAX_LIMIT);
    mockTransactionStatus(mockAccountBridge, {});
  });

  it("lists Token settings and a disabled Remove token, and opens Token settings", async () => {
    const { user } = renderFlowAt(ScreenName.XrpManageTokenManage, { balance: new BigNumber(0) });

    const removeToken = await screen.findByText("Remove token");
    expect(removeToken).toBeVisible();
    expect(screen.getByTestId("xrp-manage-token-remove")).toBeDisabled();

    await user.press(screen.getByText("Token settings"));

    const reviewButton = await screen.findByTestId("xrp-settings-review");
    expect(reviewButton).toBeVisible();
  });

  it("prefills the stored limit and rippling, with Review disabled", async () => {
    renderTokenSettings({
      balance: new BigNumber(0),
      xrpResources: {
        isLocked: false,
        isRippling: true,
        limit: new BigNumber(1000),
      },
    });

    const limitInput = await screen.findByTestId("xrp-limit-input");
    expect(limitInput).toHaveDisplayValue(/1\D?000/);
    expect(screen.getByTestId("xrp-rippling-switch")).toBeChecked();
    expect(screen.getByTestId("xrp-settings-fees")).toBeVisible();
    await waitForBridgeToSettle("1000");
    expect(getReviewButton()).toBeDisabled();
  });

  it("enables Review once the limit changes", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await replaceLimit(user, "2000");

    await waitFor(() => expect(getReviewButton()).toBeEnabled());
  });

  it("disables Review again once the limit is back to the stored value", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await replaceLimit(user, "2000");
    await waitForBridgeToSettle("2000");
    expect(getReviewButton()).toBeEnabled();

    await replaceLimit(user, "1000");
    await waitForBridgeToSettle("1000");

    expect(getReviewButton()).toBeDisabled();
  });

  it("keeps Review disabled for a limit of 0 even when the status reports no error", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await replaceLimit(user, "0");
    await waitForBridgeToSettle("0");

    expect(getReviewButton()).toBeDisabled();
  });

  it("keeps Review disabled for a limit of 0 and shows the message", async () => {
    mockTransactionStatus(mockAccountBridge, { amount: makeNamedError("XrpTrustLimitZero") });
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await replaceLimit(user, "0");

    const message = await screen.findByText("The trust limit must be above 0.");
    expect(message).toBeVisible();
    expect(getReviewButton()).toBeDisabled();
  });

  it("warns when the new limit is below the balance", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(5000) });

    const limitInput = await screen.findByTestId("xrp-limit-input");
    await user.clear(limitInput);
    expect(screen.queryByTestId("xrp-limit-below-balance-warning")).toBeNull();
    await user.type(limitInput, "100");

    const warning = await screen.findByTestId("xrp-limit-below-balance-warning");
    expect(warning).toBeVisible();
    expect(screen.getByText(/Your balance \(.*RLUSD\) is above this limit/)).toBeVisible();
    await waitFor(() => expect(getReviewButton()).toBeEnabled());
  });

  it("warns when the current limit is 0", async () => {
    renderTokenSettings({
      balance: new BigNumber(0),
      xrpResources: {
        isLocked: false,
        isRippling: false,
        limit: new BigNumber(0),
      },
    });

    const warning = await screen.findByText("Your limit is 0: you can't receive this token.");
    expect(warning).toBeVisible();
  });

  it("shows no limit error on a stored limit of 0 until the limit is edited", async () => {
    mockTransactionStatus(mockAccountBridge, { amount: makeNamedError("XrpTrustLimitZero") });
    const { user } = renderTokenSettings({
      balance: new BigNumber(0),
      xrpResources: {
        isLocked: false,
        isRippling: false,
        limit: new BigNumber(0),
      },
    });

    const currentLimitWarning = await screen.findByText(
      "Your limit is 0: you can't receive this token.",
    );
    expect(currentLimitWarning).toBeVisible();
    await waitForBridgeToSettle("0");
    expect(screen.queryByText("The trust limit must be above 0.")).toBeNull();
    expect(getReviewButton()).toBeDisabled();

    await replaceLimit(user, "0");

    const limitError = await screen.findByText("The trust limit must be above 0.");
    expect(limitError).toBeVisible();
  });

  it("does not claim a limit of 0 when the stored limit is unknown", async () => {
    mockTransactionStatus(mockAccountBridge, { amount: makeNamedError("XrpTrustLimitZero") });
    renderTokenSettings({ balance: new BigNumber(0), xrpResources: { isLocked: false } });

    const limitInput = await screen.findByTestId("xrp-limit-input");
    expect(limitInput).toHaveDisplayValue("");
    expect(screen.queryByTestId("xrp-current-limit-zero-warning")).toBeNull();
    expect(screen.queryByText("The trust limit must be above 0.")).toBeNull();
  });

  it("shows a bridge failure and keeps Review disabled", async () => {
    mockAccountBridge.getTransactionStatus.mockRejectedValue(new Error("rpc down"));
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await replaceLimit(user, "2000");

    const bridgeFailure = await screen.findByText("rpc down");
    expect(bridgeFailure).toBeVisible();
    expect(getReviewButton()).toBeDisabled();
  });

  it("warns when rippling is switched on", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    const ripplingSwitch = await screen.findByTestId("xrp-rippling-switch");
    expect(ripplingSwitch).toBeVisible();
    expect(screen.queryByTestId("xrp-rippling-warning")).toBeNull();

    await user.press(ripplingSwitch);

    expect(screen.getByTestId("xrp-rippling-warning")).toBeVisible();
    await waitFor(() => expect(getReviewButton()).toBeEnabled());
  });

  it("signs the edit without a sub account and shows the success screen", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await openReviewWithLimit(user, "2000");
    await signFromReview(user);

    const success = await screen.findByText("Token settings updated", {}, { timeout: 15000 });
    expect(success).toBeVisible();
    expect(screen.getByText(/^Trust limit: 2\D?000 RLUSD\.$/)).toBeVisible();
    expect(getSignedTransaction()).toMatchObject({
      mode: "changeTrust",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
    });
    expect(getSignedTransaction().amount.toFixed()).toBe("2000");
    expect(getSignedTransaction()).not.toHaveProperty("subAccountId");
  });

  it("blocks Continue on the review when the bridge reports an error", async () => {
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });
    await replaceLimit(user, "2000");
    await waitFor(() => expect(getReviewButton()).toBeEnabled());
    mockTransactionStatus(mockAccountBridge, {
      transaction: makeNamedError("XrpTokenOptInRefused"),
    });
    await user.press(getReviewButton());

    expect(await screen.findByText("The issuer refused this request")).toBeVisible();
    expect(screen.getByTestId("xrp-manage-review-continue")).toBeDisabled();
  });

  it("lands on the error screen when signing fails", async () => {
    mockAccountBridge.signOperation.mockImplementationOnce(
      () =>
        new Observable<SignOperationEvent>(subscriber => {
          subscriber.next({ type: "device-signature-requested" });
          subscriber.error(new Error("UserRefusedOnDevice"));
        }),
    );
    const { user } = renderTokenSettings({ balance: new BigNumber(0) });

    await openReviewWithLimit(user, "2000");
    await signFromReview(user);

    await waitFor(() => expect(screen.getByText("Retry")).toBeVisible(), { timeout: 15000 });
  });
});
