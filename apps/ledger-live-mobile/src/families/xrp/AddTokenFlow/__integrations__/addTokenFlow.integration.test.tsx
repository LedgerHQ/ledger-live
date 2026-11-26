import React from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { BridgeSyncContext } from "@ledgerhq/live-common/bridge/react/index";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { track } from "@shared/analytics";
import { HttpResponse, http, server } from "@tests/server";
import { act, render, screen, waitFor, within } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
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

type ExecutorProps = {
  intent: {
    input: { transaction: { amount: BigNumber; noRipple: boolean; assetReference?: string } };
    onResult: (signedOperation: object) => void;
  };
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onIntentJobComplete: () => void;
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

jest.mock("~/screens/Swap/navigation/navigateToSwapTab", () => {
  return { navigateToSwapTab: jest.fn() };
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

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

// coin-xrp caches each issuer's account root: a test that reads a fee needs its own issuer
const feeIouToken = { ...xrpIouToken, contractAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" };

const reserveWarning = makeNamedError("XrpReserveIncrease", { amount: "0.2 XRP" });

const SIGNED_OPERATION = {
  signature: "sig",
  operation: {
    id: "op-add",
    hash: "0xadd",
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

const nodeEndpoint = jest.fn<Response, [{ request: Request }]>();
const calEndpoint = jest.fn<Response, [{ request: Request }]>();

const mockSync = jest.fn();

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

function toCalToken(token: TokenCurrency) {
  return {
    id: token.id,
    contract_address: token.contractAddress,
    standard: token.tokenType,
    decimals: token.units[0].magnitude,
    delisted: false,
    name: token.name,
    ticker: token.ticker,
    units: token.units,
    token_identifier: token.tokenIdentifier,
  };
}

function makeCalPage(tokens: TokenCurrency[], nextCursor?: string) {
  return HttpResponse.json(tokens.map(toCalToken), {
    headers: nextCursor ? { "x-ledger-next": nextCursor } : {},
  });
}

function mockTokensInCal(tokens: TokenCurrency[]) {
  calEndpoint.mockImplementation(() => makeCalPage(tokens));
}

function getCalRequestParam(callIndex: number, name: string) {
  return new URL(calEndpoint.mock.calls[callIndex][0].request.url).searchParams.get(name);
}

function AccountScreen() {
  return <Text>XRP account screen</Text>;
}

function AddTokenFlowHarness() {
  return (
    <BridgeSyncContext.Provider value={mockSync}>
      <OuterStack.Navigator screenOptions={{ headerShown: false }}>
        <OuterStack.Screen name={ScreenName.Account} component={AccountScreen} />
        <OuterStack.Screen name={NavigatorName.XrpAddTokenFlow} component={component} />
      </OuterStack.Navigator>
    </BridgeSyncContext.Provider>
  );
}

function renderAt(
  screenName: ScreenName.XrpAddTokenSelectToken | ScreenName.XrpAddTokenReview,
  params: Record<string, unknown>,
  account = XRP_ACCOUNT,
) {
  return render(<AddTokenFlowHarness />, {
    navigationInitialState: {
      index: 1,
      routes: [
        { name: ScreenName.Account },
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

async function signFromReview(user: UserEvents) {
  await waitFor(() => expect(getContinueButton()).toBeEnabled());
  await user.press(getContinueButton());
  await screen.findByTestId("device-intent-executor");
  await signOnDevice();
}

function getSignedTransaction() {
  return getExecutorProps().intent.input.transaction;
}

describe("XRP AddTokenFlow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    mockStatus({});
    calEndpoint.mockReset();
    mockTokensInCal([xrpIouToken, xrpMptToken]);
    nodeEndpoint.mockReset();
    mockTransferRate();
    server.use(http.post(XRPL_TESTNET_NODE, nodeEndpoint), http.get("*/v1/tokens", calEndpoint));
  });

  describe("Select asset", () => {
    it("lists the assets the account can add and opens the review of the tapped one", async () => {
      const { user } = renderSelectAsset();

      const sheetTitle = await screen.findByText("Select asset");
      expect(sheetTitle).toBeVisible();
      const iouRow = await screen.findByTestId(`xrp-token-row-${xrpIouToken.id}`);
      expect(screen.getByText(xrpMptToken.ticker)).toBeVisible();
      await user.press(iouRow);

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

    it("asks the CAL for the assets of the XRPL network family", async () => {
      renderSelectAsset();

      await screen.findByTestId(`xrp-token-row-${xrpIouToken.id}`);

      expect(getCalRequestParam(0, "network_family")).toBe("ripple");
    });

    it("loads the next CAL page when the first one has nothing to add", async () => {
      calEndpoint
        .mockReset()
        .mockImplementationOnce(() => makeCalPage([xrpIouToken], "page-2"))
        .mockImplementationOnce(() => makeCalPage([xrpMptToken]));
      renderSelectAsset(XRP_ACCOUNT_WITH_TOKEN);

      const mptRow = await screen.findByTestId(`xrp-token-row-${xrpMptToken.id}`);

      expect(mptRow).toBeVisible();
      expect(calEndpoint).toHaveBeenCalledTimes(2);
      expect(getCalRequestParam(1, "cursor")).toBe("page-2");
    });

    it("offers to retry when the CAL keeps failing and lists the assets once it answers", async () => {
      calEndpoint.mockImplementation(() => HttpResponse.json({}, { status: 500 }));
      const { user } = renderSelectAsset();

      const loadError = await screen.findByText(
        "The token list couldn't load.",
        {},
        { timeout: 15000 },
      );
      expect(loadError).toBeVisible();
      mockTokensInCal([xrpIouToken, xrpMptToken]);
      await user.press(screen.getByText("Retry"));

      const iouRow = await screen.findByTestId(`xrp-token-row-${xrpIouToken.id}`);
      expect(iouRow).toBeVisible();
    });

    it("says no assets are currently available to add when every listed asset is held", async () => {
      mockTokensInCal([xrpIouToken]);
      renderSelectAsset(XRP_ACCOUNT_WITH_TOKEN);

      const emptyTitle = await screen.findByText("No assets available");
      expect(emptyTitle).toBeVisible();
      const emptyText = screen.getByText(
        "There are no assets currently available to add to this account.",
      );
      expect(emptyText).toBeVisible();
      expect(screen.getByText("Got it")).toBeVisible();
    });
  });

  describe("Review asset details", () => {
    it("shows the rows of an IOU with the maximum limit and rippling deactivated", async () => {
      renderReview(xrpIouToken);
      await waitForReview();

      expect(screen.getByText("Token type")).toBeVisible();
      expect(screen.getByText("Trust Line")).toBeVisible();
      expect(screen.getByText("Account")).toBeVisible();
      expect(screen.getByText("Asset")).toBeVisible();
      expect(screen.getByText(xrpIouToken.ticker)).toBeVisible();
      expect(screen.queryByText("Issuer")).toBeNull();
      expect(screen.queryByText(/IOU/)).toBeNull();
      expect(screen.getByText("Network fee")).toBeVisible();
      expect(screen.getByText("Balance limit")).toBeVisible();
      expect(screen.getByText("Maximum")).toBeVisible();
      expect(screen.getByText("Rippling")).toBeVisible();
      expect(getRipplingRow().getByText("Deactivated")).toBeVisible();
    });

    it("shows the rows of an MPT without balance limit or rippling", async () => {
      renderReview(xrpMptToken);
      await waitForReview();

      expect(screen.getByText("Multi-Purpose Token (MPT)")).toBeVisible();
      expect(screen.queryByText("Balance limit")).toBeNull();
      expect(screen.queryByText("Rippling")).toBeNull();
    });

    it("exposes the read-only rows by test id", async () => {
      mockTransferRate(1_010_000_000);
      mockStatus({}, { reserve: reserveWarning });
      renderReview(feeIouToken);

      const transferFeeRow = await screen.findByTestId("xrp-review-transfer-fee");
      const lockedAmountRow = await screen.findByTestId("xrp-review-locked-amount");
      const tokenTypeRow = screen.getByTestId("xrp-review-token-type");
      const networkFeeRow = screen.getByTestId("xrp-review-network-fee");

      expect(within(tokenTypeRow).getByText("Trust Line")).toBeVisible();
      expect(within(transferFeeRow).getByText("1% per transaction")).toBeVisible();
      expect(within(networkFeeRow).getByText("Network fee")).toBeVisible();
      expect(within(lockedAmountRow).getByText(/0\.200000 XRP/)).toBeVisible();
    });

    it("shows the issuer's fee", async () => {
      mockTransferRate(1_010_000_000);
      renderReview(feeIouToken);

      const transferFee = await screen.findByText("1% per transaction");
      expect(transferFee).toBeVisible();
      expect(screen.getByText("Issuer fee")).toBeVisible();
      expect(screen.queryByText("Transfer fee")).toBeNull();
    });

    it("shows the reserve the asset locks, from the reserve warning", async () => {
      mockStatus({}, { reserve: reserveWarning });
      renderReview(xrpMptToken);

      const lockedAmountLabel = await screen.findByText("Locked amount");
      expect(lockedAmountLabel).toBeVisible();
      expect(screen.getByText(/0\.200000 XRP/)).toBeVisible();
    });

    it("shows no locked amount without a reserve warning", async () => {
      renderReview(xrpMptToken);
      await waitForReview();

      expect(screen.queryByText("Locked amount")).toBeNull();
    });

    it("explains the token type in a tooltip", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByLabelText("Token type"));

      const tokenTypeInfo = await screen.findByText(
        "The standard used to issue this asset on XRPL.",
      );
      expect(tokenTypeInfo).toBeVisible();
    });

    it("explains the issuer fee in a tooltip", async () => {
      mockTransferRate(1_010_000_000);
      const { user } = renderReview(feeIouToken);
      await screen.findByText("1% per transaction");

      await user.press(screen.getByLabelText("Issuer fee"));

      const issuerFeeInfo = await screen.findByText(
        "A percentage fee set by the asset's issuer, charged in this asset each time it's transferred.",
      );
      expect(issuerFeeInfo).toBeVisible();
    });

    it("explains the balance limit in a tooltip", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByLabelText("Balance limit"));

      const balanceLimitInfo = await screen.findByText(
        "The maximum amount of this asset your account can hold.",
      );
      expect(balanceLimitInfo).toBeVisible();
    });

    it("explains rippling in a tooltip", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();

      await user.press(screen.getByLabelText("Rippling"));

      const ripplingInfo = await screen.findByText(
        "If activated, your balance can be used to route other users' payments, which may exchange it for the same asset from a different issuer.",
      );
      expect(ripplingInfo).toBeVisible();
    });

    it("explains the locked amount in a tooltip", async () => {
      mockStatus({}, { reserve: reserveWarning });
      const { user } = renderReview(xrpMptToken);

      const lockedAmountInfo = await screen.findByLabelText("Locked amount");
      await user.press(lockedAmountInfo);

      const lockedAmountText = await screen.findByText(
        "XRP amount added to your account's reserve to hold this asset.",
      );
      expect(lockedAmountText).toBeVisible();
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

    it("goes back to the review from the Lumen header back button", async () => {
      const { user } = renderReview(xrpIouToken);
      await waitForReview();
      await user.press(screen.getByTestId("xrp-review-limit"));
      await screen.findByTestId("xrp-limit-input");

      await user.press(screen.getByTestId("navigation-header-back-button"));

      await waitForReview();
      expect(screen.queryByTestId("xrp-limit-input")).toBeNull();
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
    it("blocks Continue when the account lacks XRP and offers Get XRP", async () => {
      mockStatus({
        amount: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "1.2 XRP" }),
      });
      const { user } = renderReview(xrpMptToken);

      const notEnoughTitle = await screen.findByText("Not enough balance");
      expect(notEnoughTitle).toBeVisible();
      expect(screen.getByText("You need at least 1.2 XRP to add this asset.")).toBeVisible();
      expect(getContinueButton()).toBeDisabled();

      expect(screen.getByText("Get XRP")).toBeVisible();
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

      const refusalMessage = await screen.findByText("The issuer refused this request");
      expect(refusalMessage).toBeVisible();
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

    it("replaces the review with the full-screen confirmation, leaving no review errors behind", async () => {
      const { user } = renderReview(xrpMptToken);

      await signFromReview(user);

      await screen.findByTestId("xrp-add-token-success", {}, { timeout: 15000 });
      expect(screen.getByTestId("xrp-add-token-success-close")).toBeVisible();
      expect(screen.queryByText("Review asset details")).toBeNull();
      expect(screen.queryByTestId("xrp-add-token-sheet")).toBeNull();
    });

    it("closes the flow on Got it and returns to the account screen", async () => {
      const { user } = renderReview(xrpMptToken);
      await signFromReview(user);
      await screen.findByTestId("xrp-add-token-success", {}, { timeout: 15000 });

      await user.press(screen.getByText("Got it"));

      const accountScreen = await screen.findByText("XRP account screen");
      expect(accountScreen).toBeVisible();
      expect(screen.queryByTestId("xrp-add-token-success")).toBeNull();
    });

    it("syncs the account once the opt-in is broadcast, not before", async () => {
      const { user } = renderReview(xrpMptToken);
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      await screen.findByTestId("device-intent-executor");

      expect(mockSync).not.toHaveBeenCalled();

      await signOnDevice();
      await screen.findByTestId("xrp-add-token-success", {}, { timeout: 15000 });

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: XRP_ACCOUNT.id,
        reason: "transaction-flow-confirmation",
      });
    });

    it("shows Failed to add asset when the device cannot be prepared", async () => {
      jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("no device"));
      const { user } = renderReview(xrpMptToken);

      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());

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

    it("signs again on Try again after a failed broadcast", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("network down"));
      const { user } = renderReview(xrpMptToken);
      await signFromReview(user);
      await screen.findByText("Failed to add asset", {}, { timeout: 15000 });

      await user.press(screen.getByTestId("xrp-add-token-retry"));
      await screen.findByTestId("device-intent-executor");
      await signOnDevice();

      const successTitle = await screen.findByText("Asset added", {}, { timeout: 15000 });
      expect(successTitle).toBeVisible();
      expect(mockAccountBridge.broadcast).toHaveBeenCalledTimes(2);
    });

    it("tracks a signing error by name", async () => {
      const { user } = renderReview(xrpMptToken);
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      await screen.findByTestId("device-intent-executor");

      act(() => {
        getExecutorProps().onIntentJobStateChanged({
          type: "error",
          error: makeNamedError("TransportStatusError"),
          retry: jest.fn(),
        });
      });

      const errorEvents = jest.mocked(track).mock.calls.filter(([event]) => {
        return event === "error_displayed";
      });
      expect(errorEvents).toEqual([
        [
          "error_displayed",
          {
            action: "add",
            currency: XRP_ACCOUNT.currency.id,
            tokenType: "mpt",
            step: "signature",
            message_id: "TransportStatusError",
            message_type: "error",
          },
        ],
      ]);
    });

    it("closes the sheet instead of signing on Try again once the transaction has an error", async () => {
      mockAccountBridge.broadcast.mockRejectedValueOnce(new Error("network down"));
      const { user, store } = renderReview(xrpMptToken);
      await signFromReview(user);
      const retryButton = await screen.findByTestId("xrp-add-token-retry", {}, { timeout: 15000 });
      mockStatus({ transaction: makeNamedError("XrpTokenOptInRefused") });
      await act(async () => {
        store.dispatch(updateAccount({ id: XRP_ACCOUNT.id, balance: new BigNumber(1) }));
      });
      await screen.findByText("The issuer refused this request");
      jest.mocked(buildDeviceInitializationInput).mockClear();

      await user.press(retryButton);

      expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
      expect(screen.queryByTestId("device-intent-executor")).toBeNull();
      expect(getContinueButton()).toBeDisabled();
    });

    it("disables Continue during the device step and enables it again once cancelled", async () => {
      const { user } = renderReview(xrpMptToken);
      await waitFor(() => expect(getContinueButton()).toBeEnabled());
      await user.press(getContinueButton());
      await screen.findByTestId("device-intent-executor");
      expect(getContinueButton()).toBeDisabled();

      act(() => getExecutorProps().onUserCancel());

      await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
      expect(getContinueButton()).toBeEnabled();
    });
  });
});
