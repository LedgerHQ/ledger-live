import React from "react";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, render, screen, waitFor, within } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
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

function renderFlowWith(params: Record<string, unknown>, screenName: ScreenName, account: Account) {
  return render(<ManageTokenFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.XrpManageTokenFlow,
          state: { index: 0, routes: [{ name: screenName, params }] },
        },
      ],
    },
    overrideInitialState: overrideWithAccounts(account),
  });
}

function renderManageAssets(...tokenAccounts: XrpTokenAccount[]) {
  const account = { ...XRP_ACCOUNT, subAccounts: tokenAccounts };

  return renderFlowWith({ accountId: account.id }, ScreenName.XrpManageTokenManage, account);
}

function renderTokenSettings(overrides: Partial<XrpTokenAccount> = {}) {
  const { account, tokenAccount } = makeAccountWithToken(overrides);

  return renderFlowWith(
    { accountId: tokenAccount.id, parentId: account.id },
    ScreenName.XrpManageTokenSettings,
    account,
  );
}

function getContinueButton() {
  return screen.getByTestId("xrp-settings-continue");
}

async function replaceLimit(user: UserEvents, text: string) {
  const limitRow = await screen.findByTestId("xrp-settings-limit-row");
  await user.press(limitRow);
  const limitInput = await screen.findByTestId("xrp-limit-input");
  await user.clear(limitInput);
  await user.type(limitInput, text);
  await user.press(screen.getByTestId("xrp-limit-confirm"));
  await screen.findByTestId("xrp-settings-limit-row");
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
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
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

describe("XRP ManageTokenFlow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    jest.mocked(getMaxTrustLimitForToken).mockReturnValue(MAX_LIMIT);
    mockTransactionStatus(mockAccountBridge, {});
  });

  describe("Manage assets", () => {
    it("lists an IOU card with its details, Edit and a disabled Delete", async () => {
      renderManageAssets({
        ...XRP_IOU_TOKEN_ACCOUNT,
        xrpResources: {
          isLocked: false,
          isRippling: true,
          limit: new BigNumber(1000),
        },
      });

      const card = await screen.findByTestId(`xrp-manage-asset-${XRP_IOU_TOKEN_ACCOUNT.id}`);
      expect(within(card).getByText("Trust Line (IOU)")).toBeVisible();
      expect(within(card).getByText(/1\D?000 RLUSD/)).toBeVisible();
      expect(within(card).getByText("Activated")).toBeVisible();
      expect(within(card).getByText("Edit")).toBeVisible();
      expect(within(card).getByText("Delete")).toBeVisible();
      expect(
        screen.getByTestId(`xrp-manage-asset-delete-${XRP_IOU_TOKEN_ACCOUNT.id}`),
      ).toBeDisabled();
    });

    it("shows Maximum when the limit is the maximum", async () => {
      renderManageAssets({
        ...XRP_IOU_TOKEN_ACCOUNT,
        xrpResources: { isLocked: false, isRippling: false, limit: MAX_LIMIT },
      });

      const card = await screen.findByTestId(`xrp-manage-asset-${XRP_IOU_TOKEN_ACCOUNT.id}`);
      expect(within(card).getByText("Maximum")).toBeVisible();
      expect(within(card).getByText("Deactivated")).toBeVisible();
    });

    it("has no Edit and no limit on an MPT card", async () => {
      const mptTokenAccount: XrpTokenAccount = {
        ...genTokenAccount(1, XRP_ACCOUNT, xrpMptToken),
        xrpResources: { isLocked: false },
      };
      renderManageAssets(mptTokenAccount);

      const card = await screen.findByTestId(`xrp-manage-asset-${mptTokenAccount.id}`);
      expect(within(card).getByText("Multi purpose token")).toBeVisible();
      expect(within(card).queryByText("Edit")).toBeNull();
      expect(within(card).queryByText("Balance limit")).toBeNull();
      expect(within(card).getByText("Delete")).toBeVisible();
    });

    it("skips a removed token and says so when nothing is left", async () => {
      renderManageAssets(XRP_REMOVED_TOKEN_ACCOUNT);

      const emptyMessage = await screen.findByTestId("xrp-manage-assets-empty");
      expect(emptyMessage).toBeVisible();
    });

    it("opens Edit details from Edit", async () => {
      const { user } = renderManageAssets(XRP_IOU_TOKEN_ACCOUNT);

      const editButton = await screen.findByText("Edit");
      await user.press(editButton);

      const continueButton = await screen.findByTestId("xrp-settings-continue");
      expect(continueButton).toBeVisible();
    });
  });

  describe("Edit details", () => {
    it("prefills the stored limit and rippling, with Continue disabled", async () => {
      renderTokenSettings({
        balance: new BigNumber(0),
        xrpResources: {
          isLocked: false,
          isRippling: true,
          limit: new BigNumber(1000),
        },
      });

      const limitValue = await screen.findByTestId("xrp-settings-limit-value");
      expect(limitValue).toHaveTextContent(/1\D?000 RLUSD/);
      expect(screen.getByTestId("xrp-settings-rippling-value")).toHaveTextContent("Activated");
      await waitForBridgeToSettle("1000");
      expect(getContinueButton()).toBeDisabled();
    });

    it("shows the maximum limit as Maximum", async () => {
      renderTokenSettings({
        balance: new BigNumber(0),
        xrpResources: { isLocked: false, isRippling: false, limit: MAX_LIMIT },
      });

      const limitValue = await screen.findByTestId("xrp-settings-limit-value");
      expect(limitValue).toHaveTextContent("Maximum");
    });

    it("enables Continue once the limit is confirmed on Balance limit", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      await replaceLimit(user, "2000");

      expect(screen.getByTestId("xrp-settings-limit-value")).toHaveTextContent(/2\D?000 RLUSD/);
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
    });

    it("prefills Balance limit with the current limit", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      const limitRow = await screen.findByTestId("xrp-settings-limit-row");
      await user.press(limitRow);

      const limitInput = await screen.findByTestId("xrp-limit-input");
      expect(limitInput).toHaveDisplayValue("1000");
    });

    it("sets the maximum from Balance limit", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      const limitRow = await screen.findByTestId("xrp-settings-limit-row");
      await user.press(limitRow);
      const setMaximumButton = await screen.findByTestId("xrp-limit-set-maximum");
      await user.press(setMaximumButton);
      await user.press(screen.getByTestId("xrp-limit-confirm"));

      const limitValue = await screen.findByTestId("xrp-settings-limit-value");
      expect(limitValue).toHaveTextContent("Maximum");
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
    });

    it("keeps Confirm disabled for a limit of 0 and shows the message", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      const limitRow = await screen.findByTestId("xrp-settings-limit-row");
      await user.press(limitRow);
      const limitInput = await screen.findByTestId("xrp-limit-input");
      await user.clear(limitInput);
      await user.type(limitInput, "0");

      const limitZeroMessage = await screen.findByText("The trust limit must be above 0.");
      expect(limitZeroMessage).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("disables Continue again once the limit is back to the stored value", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      await replaceLimit(user, "2000");
      await waitForBridgeToSettle("2000");
      expect(getContinueButton()).toBeEnabled();

      await replaceLimit(user, "1000");
      await waitForBridgeToSettle("1000");

      expect(getContinueButton()).toBeDisabled();
    });

    it("warns when the new limit is below the balance", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(500) });

      await screen.findByTestId("xrp-settings-limit-row");
      expect(screen.queryByTestId("xrp-limit-below-balance-warning")).toBeNull();
      await replaceLimit(user, "100");

      const belowBalanceWarning = await screen.findByTestId("xrp-limit-below-balance-warning");
      expect(belowBalanceWarning).toBeVisible();
      expect(screen.getByText(/Your balance \(.*RLUSD\) is above this limit/)).toBeVisible();
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
    });

    it("warns when the current limit is 0 and keeps Continue disabled", async () => {
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
      expect(getContinueButton()).toBeDisabled();
    });

    it("does not claim a limit of 0 when the stored limit is unknown", async () => {
      renderTokenSettings({ balance: new BigNumber(0), xrpResources: { isLocked: false } });

      await screen.findByTestId("xrp-settings-limit-row");
      expect(screen.queryByTestId("xrp-current-limit-zero-warning")).toBeNull();
    });

    it("shows a bridge failure and keeps Continue disabled", async () => {
      mockAccountBridge.getTransactionStatus.mockRejectedValue(new Error("rpc down"));
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      await replaceLimit(user, "2000");

      const bridgeFailure = await screen.findByText("rpc down");
      expect(bridgeFailure).toBeVisible();
      expect(getContinueButton()).toBeDisabled();
    });

    it("changes rippling from the sheet, warns when activated and enables Continue", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

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

  describe("Review and signing", () => {
    it("signs the edit without a sub account and shows the success screen", async () => {
      const { user } = renderTokenSettings({ balance: new BigNumber(0) });

      await openReviewWithLimit(user, "2000");
      await signFromReview(user);

      const success = await screen.findByText("Token settings updated", {}, { timeout: 15000 });
      expect(success).toBeVisible();
      expect(screen.getByText(/^Balance limit: 2\D?000 RLUSD\.$/)).toBeVisible();
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
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      mockTransactionStatus(mockAccountBridge, {
        transaction: makeNamedError("XrpTokenOptInRefused"),
      });
      await user.press(getContinueButton());

      const refusalMessage = await screen.findByText("The issuer refused this request");
      expect(refusalMessage).toBeVisible();
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
});
