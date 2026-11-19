import React from "react";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useTokensData } from "@features/platform-currencies";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { copyToClipboard } from "@shared/clipboard";
import { HttpResponse, http, server } from "@tests/server";
import { act, render, screen, waitFor, within } from "@tests/test-renderer";
import { updateAccount } from "~/actions/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { component } from "../index";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  overrideWithAccounts,
} from "../../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";
import { makeMockAccountBridge, makeNamedError } from "../../__mocks__/bridge.mock";

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

jest.mock("@features/platform-currencies");

jest.mock("~/screens/Swap/navigation/navigateToSwapTab", () => {
  return { navigateToSwapTab: jest.fn() };
});

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));

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

const mockUseTokensData = jest.mocked(useTokensData);

const OuterStack = createNativeStackNavigator();

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

// coin-xrp caches each issuer's account root: a test that reads a fee needs its own issuer
const feeIouToken = { ...xrpIouToken, contractAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" };

const reserveWarning = makeNamedError("XrpReserveIncrease", { amount: "0.2 XRP" });

const nodeEndpoint = jest.fn<Response, [{ request: Request }]>();

function mockTransferRate(transferRate?: number) {
  nodeEndpoint.mockImplementation(() => {
    const node = {
      LedgerEntryType: "AccountRoot",
      Flags: 0,
      TransferRate: transferRate,
    };

    return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
  });
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

function mockTokensInCal(tokens: TokenCurrency[]) {
  mockUseTokensData.mockReturnValue({
    data: { tokens, pagination: {} },
    isLoading: false,
    isError: false,
    loadNext: undefined,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useTokensData>);
}

function AddTokenFlowHarness() {
  return (
    <OuterStack.Navigator screenOptions={{ headerShown: false }}>
      <OuterStack.Screen name={NavigatorName.XrpAddTokenFlow} component={component} />
    </OuterStack.Navigator>
  );
}

function renderAt(
  screenName: ScreenName.XrpAddTokenSelectToken | ScreenName.XrpAddTokenReview,
  params: Record<string, unknown>,
  account = XRP_ACCOUNT,
) {
  return render(<AddTokenFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.XrpAddTokenFlow,
          state: {
            index: 0,
            routes: [{ name: screenName, params: { accountId: account.id, ...params } }],
          },
        },
      ],
    },
    overrideInitialState: overrideWithAccounts(account),
  });
}

function renderSelectAsset(account = XRP_ACCOUNT) {
  return renderAt(ScreenName.XrpAddTokenSelectToken, {}, account);
}

function renderReview(token: TokenCurrency) {
  return renderAt(ScreenName.XrpAddTokenReview, { token });
}

function getContinueButton() {
  return screen.getByTestId("xrp-review-continue");
}

function getRipplingRow() {
  return within(screen.getByTestId("xrp-review-rippling"));
}

type UserEvents = ReturnType<typeof render>["user"];

async function waitForReview() {
  await screen.findByText("Review asset details");
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
}

async function setBalanceLimit(user: UserEvents, text: string) {
  const limitRow = await screen.findByTestId("xrp-review-limit");
  await user.press(limitRow);
  const limitInput = await screen.findByTestId("xrp-limit-input");
  await user.type(limitInput, text);
  await user.press(screen.getByTestId("xrp-limit-confirm"));
  await waitForReview();
}

async function signFromReview(user: UserEvents) {
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
  await user.press(await screen.findByTestId("device-item-mock", {}, { timeout: 10000 }));
}

function getSignedTransaction() {
  const calls = mockAccountBridge.signOperation.mock.calls as unknown as [
    { transaction: { amount: BigNumber; noRipple: boolean } },
  ][];

  return calls[0][0].transaction;
}

describe("XRP AddTokenFlow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    mockStatus({});
    mockTokensInCal([xrpIouToken, xrpMptToken]);
    nodeEndpoint.mockReset();
    mockTransferRate();
    server.use(http.post(XRPL_TESTNET_NODE, nodeEndpoint));
  });

  describe("Select asset", () => {
    it("lists the assets the account can add and opens the review of the tapped one", async () => {
      const { user } = renderSelectAsset();

      const sheetTitle = await screen.findByText("Select asset");
      expect(sheetTitle).toBeVisible();
      expect(screen.getByText(xrpMptToken.ticker)).toBeVisible();
      await user.press(screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`));

      const reviewTitle = await screen.findByText("Review asset details");
      expect(reviewTitle).toBeVisible();
    });

    it("hides the assets the account already holds", async () => {
      renderSelectAsset(XRP_ACCOUNT_WITH_TOKEN);

      const mptRow = await screen.findByTestId(`xrp-token-row-${xrpMptToken.id}`);
      expect(mptRow).toBeVisible();
      expect(screen.queryByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeNull();
    });

    it("narrows the list with the search", async () => {
      const { user } = renderSelectAsset();

      const search = await screen.findByTestId("xrp-token-search");
      await user.type(search, "tmpt");

      expect(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeVisible();
      expect(screen.queryByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeNull();
    });

    it("says no assets are available when the account holds them all", async () => {
      mockTokensInCal([xrpIouToken]);
      renderSelectAsset(XRP_ACCOUNT_WITH_TOKEN);

      const emptyTitle = await screen.findByText("No assets available");
      expect(emptyTitle).toBeVisible();
      expect(
        screen.getByText("You've already added all assets available on XRPL for this account."),
      ).toBeVisible();
      expect(screen.getByText("Got it")).toBeVisible();
    });
  });

  describe("Review asset details", () => {
    it("shows the rows of an IOU with the maximum limit and rippling deactivated", async () => {
      renderReview(xrpIouToken);
      await waitForReview();

      expect(screen.getByText("Token type")).toBeVisible();
      expect(screen.getByText("Trust Line (IOU)")).toBeVisible();
      expect(screen.getByText("Account")).toBeVisible();
      expect(screen.getByText("Asset")).toBeVisible();
      expect(screen.getByText(xrpIouToken.ticker)).toBeVisible();
      expect(screen.getByText("Issuer")).toBeVisible();
      expect(screen.getByText("Network fee")).toBeVisible();
      expect(screen.getByText("Balance limit")).toBeVisible();
      expect(screen.getByText("Maximum")).toBeVisible();
      expect(screen.getByText("Rippling")).toBeVisible();
      expect(getRipplingRow().getByText("Deactivated")).toBeVisible();
    });

    it("shows the rows of an MPT without balance limit or rippling", async () => {
      renderReview(xrpMptToken);
      await waitForReview();

      expect(screen.getByText("Multi Purpose Token")).toBeVisible();
      expect(screen.queryByText("Balance limit")).toBeNull();
      expect(screen.queryByText("Rippling")).toBeNull();
    });

    it("shows the issuer's transfer fee", async () => {
      mockTransferRate(1_010_000_000);
      renderReview(feeIouToken);

      const transferFee = await screen.findByText("1% per transaction");
      expect(transferFee).toBeVisible();
    });

    it("shows the reserve the asset locks, from the reserve warning", async () => {
      mockStatus({}, { reserve: reserveWarning });
      renderReview(xrpMptToken);

      const lockedAmountLabel = await screen.findByText("Locked amount");
      expect(lockedAmountLabel).toBeVisible();
      expect(screen.getByText(/0\.2 XRP/)).toBeVisible();
    });

    it("shows no locked amount without a reserve warning", async () => {
      renderReview(xrpMptToken);
      await waitForReview();

      expect(screen.queryByText("Locked amount")).toBeNull();
    });

    it("explains the token type in an info sheet", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByTestId("xrp-review-token-type-info"));

      const tokenTypeInfo = await screen.findByText(
        /A trust line \(IOU\) has a balance limit and a rippling setting/,
      );
      expect(tokenTypeInfo).toBeVisible();
    });

    it("explains the locked amount in an info sheet", async () => {
      mockStatus({}, { reserve: reserveWarning });
      const { user } = renderReview(xrpMptToken);

      const lockedAmountInfo = await screen.findByTestId("xrp-review-locked-amount-info");
      await user.press(lockedAmountInfo);

      const lockedAmountText = await screen.findByText(
        "XRP the network sets aside while you hold this asset. You get it back when you remove the asset.",
      );
      expect(lockedAmountText).toBeVisible();
    });

    it("copies the issuer address", async () => {
      const { user } = renderReview(xrpMptToken);
      await waitForReview();

      await user.press(screen.getByTestId("xrp-review-copy-issuer"));

      expect(copyToClipboard).toHaveBeenCalledWith(xrpMptToken.contractAddress);
    });
  });

  describe("Balance limit", () => {
    it("signs the limit set on the Balance limit screen", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await setBalanceLimit(user, "1500");

      expect(screen.getByText("1,500 RLUSD")).toBeVisible();
      await signFromReview(user);
      await screen.findByText("Asset added", {}, { timeout: 15000 });
      expect(getSignedTransaction().amount.toFixed()).toBe("1500");
    });

    it("blocks Confirm for a limit of 0 with its own message", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByTestId("xrp-review-limit"));
      const limitInput = await screen.findByTestId("xrp-limit-input");
      await user.type(limitInput, "0");

      const limitZeroMessage = await screen.findByText("The limit must be above 0");
      expect(limitZeroMessage).toBeVisible();
      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("blocks Confirm while the field is empty", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByTestId("xrp-review-limit"));
      const limitInput = await screen.findByTestId("xrp-limit-input");
      await user.type(limitInput, "5");
      await user.clear(limitInput);

      expect(screen.getByTestId("xrp-limit-confirm")).toBeDisabled();
    });

    it("puts Maximum back with Set to maximum", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();
      await setBalanceLimit(user, "1500");

      await user.press(screen.getByTestId("xrp-review-limit"));
      const setToMaximum = await screen.findByTestId("xrp-limit-set-maximum");
      await user.press(setToMaximum);
      await user.press(screen.getByTestId("xrp-limit-confirm"));
      await waitForReview();

      expect(screen.getByText("Maximum")).toBeVisible();
      await signFromReview(user);
      await screen.findByText("Asset added", {}, { timeout: 15000 });
      expect(getSignedTransaction().amount).toEqual(MAX_TRUST_LIMIT);
    });
  });

  describe("Rippling", () => {
    it("signs with rippling on once Activated is chosen, and warns about it", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      expect(screen.queryByTestId("xrp-rippling-warning")).toBeNull();
      await user.press(screen.getByTestId("xrp-review-rippling"));
      const activatedOption = await screen.findByTestId("xrp-rippling-option-activated");
      await user.press(activatedOption);

      const activatedValue = await getRipplingRow().findByText("Activated");
      expect(activatedValue).toBeVisible();
      expect(screen.getByTestId("xrp-rippling-warning")).toBeVisible();
      await signFromReview(user);
      await screen.findByText("Asset added", {}, { timeout: 15000 });
      expect(getSignedTransaction().noRipple).toBe(false);
    });

    it("signs with rippling off by default", async () => {
      const { user } = renderReview(xrpIouToken);

      await signFromReview(user);
      await screen.findByText("Asset added", {}, { timeout: 15000 });

      expect(getSignedTransaction().noRipple).toBe(true);
    });
  });

  describe("Errors on the review", () => {
    it("blocks Continue when the account lacks XRP and offers Go to swap", async () => {
      mockStatus({
        amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "1.2 XRP" }),
      });
      const { user } = renderReview(xrpMptToken);

      const notEnoughTitle = await screen.findByText("Not enough balance");
      expect(notEnoughTitle).toBeVisible();
      expect(
        screen.getByText("You need at least 1.2 XRP to cover for this transaction."),
      ).toBeVisible();
      expect(getContinueButton()).toBeDisabled();

      await user.press(screen.getByTestId("xrp-go-to-swap"));

      expect(navigateToSwapTab).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { toCurrencyId: XRP_ACCOUNT.currency.id, toAccountId: XRP_ACCOUNT.id },
        }),
      );
    });

    it("unblocks once the account gets funded", async () => {
      mockStatus({
        amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "1.2 XRP" }),
      });
      const { store } = renderReview(xrpMptToken);
      await screen.findByText("Not enough balance");

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
  });

  describe("Result screens", () => {
    it("shows Asset added once the opt-in is signed and broadcast", async () => {
      const { user } = renderReview(xrpMptToken);

      await signFromReview(user);

      const successTitle = await screen.findByText("Asset added", {}, { timeout: 15000 });
      expect(successTitle).toBeVisible();
      expect(screen.getByText("You can now make transactions with this asset.")).toBeVisible();
      expect(screen.getByText("Got it")).toBeVisible();
      expect(getSignedTransaction()).toMatchObject({
        mode: "changeTrust",
        assetReference: xrpMptToken.tokenIdentifier,
        assetOwner: xrpMptToken.contractAddress,
      });
    });

    it("shows Failed to add asset when signing fails", async () => {
      mockAccountBridge.signOperation.mockImplementationOnce(
        () =>
          new Observable<SignOperationEvent>(subscriber => {
            subscriber.next({ type: "device-signature-requested" });
            subscriber.error(new Error("UserRefusedOnDevice"));
          }),
      );
      const { user } = renderReview(xrpMptToken);

      await signFromReview(user);

      const errorTitle = await screen.findByText("Failed to add asset", {}, { timeout: 15000 });
      expect(errorTitle).toBeVisible();
      expect(screen.getByText("Try again")).toBeVisible();
      expect(screen.getByText("Close")).toBeVisible();
      expect(screen.queryByTestId("xrp-add-token-broadcast-error")).toBeNull();
    });

    it("warns that the transaction may have gone through when its broadcast fails", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("network down"));
      const { user } = renderReview(xrpMptToken);

      await signFromReview(user);

      const errorTitle = await screen.findByText("Failed to add asset", {}, { timeout: 15000 });
      expect(errorTitle).toBeVisible();
      expect(screen.getByTestId("xrp-add-token-broadcast-error")).toBeVisible();
    });
  });
});
