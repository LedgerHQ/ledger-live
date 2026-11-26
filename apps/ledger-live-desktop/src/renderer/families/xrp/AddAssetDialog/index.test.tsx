import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor, within } from "tests/testSetup";
import type { UserEvent } from "@testing-library/user-event";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { useTokensData } from "@features/platform-currencies";
import {
  getIssuerFeeForToken,
  getNetworkReservesForCurrency,
} from "@ledgerhq/live-common/families/xrp/logicPublic";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { Account } from "@ledgerhq/types-live";
import { trackPage } from "@shared/analytics";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import AccountDialogs from "../AccountDialogs";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken, xrpRlusdToken } from "../__mocks__/currency.mock";
import {
  makeNamedError,
  mockBroadcast,
  mockSignedInput,
  signedOperation,
} from "../__mocks__/signing.mock";

const mockNavigate = jest.fn();
const mockOpenURL = jest.fn();
const mockBridge: { pending: boolean; error: Error | null } = { pending: false, error: null };

const mockStatus = {
  errors: {} as Record<string, Error>,
  warnings: {},
  estimatedFees: new BigNumber(12),
};

jest.mock("~/renderer/linking", () => ({ openURL: (url: string) => mockOpenURL(url) }));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));
jest.mock("@features/platform-currencies", () => ({ useTokensData: jest.fn() }));
jest.mock("@ledgerhq/live-common/families/xrp/logicPublic", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/logicPublic"),
  getIssuerFeeForToken: jest.fn(),
  getNetworkReservesForCurrency: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () =>
  require("../__mocks__/signing.mock"),
);
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => {
  const { useState } = jest.requireActual("react");

  return {
    __esModule: true,
    default: (_: unknown, init: () => { transaction: object }) => {
      const [transaction, setTransaction] = useState(() => init().transaction);

      return {
        transaction,
        updateTransaction: setTransaction,
        status: mockStatus,
        bridgePending: mockBridge.pending,
        bridgeError: mockBridge.error,
      };
    },
  };
});
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => require("../__mocks__/signing.mock"));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: require("../__mocks__/signing.mock").createIntent,
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => require("../__mocks__/signing.mock"));

const mockUseTokensData = jest.mocked(useTokensData);
const mockGetIssuerFeeForToken = jest.mocked(getIssuerFeeForToken);
const mockGetNetworkReservesForCurrency = jest.mocked(getNetworkReservesForCurrency);

const ONE_RLUSD = new BigNumber(1).shiftedBy(38);
const rlusd: TokenCurrency = { ...xrpRlusdToken, name: "Ripple USD" };
const heldRlusd: TokenCurrency = { ...xrpIouToken, name: "Held RLUSD" };

const rlusdMpt: TokenCurrency = {
  ...xrpMptToken,
  id: TokenCurrencyIdSchema.parse("ripple_testnet/mpt/rlusd"),
  name: "RLUSD MPT",
  ticker: "RLUSD",
};

function mockTokens(tokens: TokenCurrency[]) {
  mockUseTokensData.mockReturnValue({
    data: { tokens, pagination: { nextCursor: undefined } },
    isLoading: false,
    isError: false,
    loadNext: undefined,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useTokensData>);
}

function renderAddAsset(params: object = { screen: "addAsset" }, account: Account = XRP_ACCOUNT) {
  const onClose = jest.fn();
  const getDialog = () => (
    <AccountDialogs account={account} parentAccount={null} params={params} onClose={onClose} />
  );

  const rendered = render(getDialog(), { initialState: { accounts: [account] } });

  return { ...rendered, onClose, rerenderDialog: () => rendered.rerender(getDialog()) };
}

function getRow(token: TokenCurrency) {
  return screen.getByText(token.name).closest("[data-testid^='asset-item-ticker-']");
}

async function openReview(user: UserEvent, token: TokenCurrency) {
  await user.click(screen.getByText(token.name));
}

function getContinue() {
  return screen.getByTestId("xrp-add-asset-continue");
}

async function continueToDevice(user: UserEvent) {
  await waitFor(() => expect(getContinue()).toBeEnabled());
  await user.click(getContinue());
}

function getTrackedScreens() {
  return jest.mocked(trackPage).mock.calls.map(([page]) => `${page.category} ${page.name}`);
}

async function activateRippling(user: UserEvent) {
  await user.click(screen.getByTestId("xrp-trust-rippling-row"));
  const activatedOption = await screen.findByRole("menuitemradio", { name: "Activated" });
  await user.click(activatedOption);
}

describe("xrp AddAssetDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDomMeasurements();
    mockStatus.errors = {};
    mockBridge.pending = false;
    mockBridge.error = null;
    mockTokens([rlusd, xrpMptToken]);
    mockGetIssuerFeeForToken.mockResolvedValue("1");
    mockGetNetworkReservesForCurrency.mockResolvedValue({ base: "1000000", increment: "200000" });
  });

  describe("Select asset", () => {
    it("lists the tokens the account can add, without the held ones", () => {
      mockTokens([rlusd, heldRlusd, xrpMptToken]);
      renderAddAsset(
        { screen: "addAsset" },
        { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT] },
      );

      expect(screen.getByRole("dialog", { name: "Select asset" })).toBeVisible();
      expect(screen.getByText(rlusd.name)).toBeVisible();
      expect(screen.getByText(xrpMptToken.name)).toBeVisible();
      expect(screen.queryByText(heldRlusd.name)).not.toBeInTheDocument();
    });

    it("filters the tokens by name, ticker and issuer", async () => {
      const { user } = renderAddAsset();
      const search = screen.getByTestId("xrp-add-asset-search");

      await user.type(search, "test");

      expect(screen.getByText(xrpMptToken.name)).toBeVisible();
      expect(screen.queryByText(rlusd.name)).not.toBeInTheDocument();

      await user.clear(search);
      await user.type(search, "rlusd");

      expect(screen.getByText(rlusd.name)).toBeVisible();
      expect(screen.queryByText(xrpMptToken.name)).not.toBeInTheDocument();

      await user.clear(search);
      await user.type(search, xrpMptToken.contractAddress);

      expect(screen.getByText(xrpMptToken.name)).toBeVisible();
      expect(screen.queryByText(rlusd.name)).not.toBeInTheDocument();
    });

    it("loads the next page while a search has no match", async () => {
      const loadNext = jest.fn();
      mockUseTokensData.mockReturnValue({
        data: { tokens: [rlusd], pagination: { nextCursor: "next" } },
        isLoading: false,
        isError: false,
        loadNext,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTokensData>);
      const { user, rerenderDialog } = renderAddAsset();
      loadNext.mockClear();

      await user.click(screen.getByTestId("xrp-add-asset-search"));
      await user.paste("test");

      expect(loadNext).toHaveBeenCalled();

      mockTokens([rlusd, xrpMptToken]);
      rerenderDialog();

      expect(screen.getByText(xrpMptToken.name)).toBeVisible();
    });

    it("shows each token by name and ticker only, even when tickers repeat", () => {
      mockTokens([rlusd, rlusdMpt]);
      renderAddAsset();

      expect(getRow(rlusd)).toHaveTextContent(/Ripple USDRLUSD$/);
      expect(getRow(rlusdMpt)).toHaveTextContent(/RLUSD MPTRLUSD$/);
    });

    it("explains there is nothing to add, and closes on Got it", async () => {
      mockTokens([]);
      const { user, onClose } = renderAddAsset();

      expect(screen.getByText("No assets available")).toBeVisible();

      expect(
        screen.getByText("You've already added all assets available on XRPL for this account."),
      ).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Got it" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("tracks the asset selection once when the list loads empty", () => {
      mockUseTokensData.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
        loadNext: undefined,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTokensData>);
      mockTokens([]);
      const { rerenderDialog } = renderAddAsset();

      rerenderDialog();

      expect(screen.getByText("No assets available")).toBeVisible();
      expect(getTrackedScreens()).toEqual(["XRP add token Step Token"]);
    });
  });

  describe("Review asset details", () => {
    it("shows the IOU details and its settings", async () => {
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByRole("dialog", { name: "Review asset details" })).toBeVisible();
      expect(screen.getByText("Trust Line")).toBeVisible();
      expect(screen.getByText(formatAddress(XRP_ACCOUNT.freshAddress))).toBeVisible();
      expect(screen.getByTestId("xrp-add-asset-asset")).toHaveTextContent(rlusd.name);
      const issuerFee = await screen.findByText("1% per transaction");
      expect(issuerFee).toBeVisible();
      expect(screen.getByTestId("xrp-add-asset-network-fee")).toHaveTextContent("0.000012 XRP");
      const lockedAmount = await screen.findByText("0.2 XRP");
      expect(lockedAmount).toBeVisible();
      expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("Maximum");
      expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Deactivated");
      expect(getContinue()).toBeEnabled();
    });

    it("opens the issuer's account in the explorer from the asset", async () => {
      const { user } = renderAddAsset();
      await openReview(user, rlusd);

      await user.click(screen.getByTestId("xrp-add-asset-issuer-link"));

      expect(mockOpenURL).toHaveBeenCalledTimes(1);
      expect(mockOpenURL).toHaveBeenCalledWith(
        `https://testnet.xrpl.org/accounts/${rlusd.contractAddress}`,
      );
    });

    it("shows the MPT details without IOU settings", async () => {
      const { user } = renderAddAsset();

      await openReview(user, xrpMptToken);

      expect(screen.getByText("Multi-Purpose Token (MPT)")).toBeVisible();
      const lockedAmount = await screen.findByText("0.2 XRP");
      expect(lockedAmount).toBeVisible();
      expect(screen.queryByTestId("xrp-trust-limit-row")).not.toBeInTheDocument();
      expect(screen.queryByTestId("xrp-trust-rippling-row")).not.toBeInTheDocument();
    });

    it("opens on the token passed by the caller, and goes back to the list", async () => {
      const { user } = renderAddAsset({ screen: "addAsset", token: rlusd });

      expect(screen.getByRole("dialog", { name: "Review asset details" })).toBeVisible();

      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByRole("dialog", { name: "Select asset" })).toBeVisible();
    });

    it("keeps Continue off until the issuer fee loads, and when it fails", async () => {
      mockGetIssuerFeeForToken.mockRejectedValue(new Error("timeout"));
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(getContinue()).toBeDisabled();
      const issuerFee = within(screen.getByTestId("xrp-add-asset-issuer-fee"));
      const unavailableFee = await issuerFee.findByText("Couldn't load");
      expect(unavailableFee).toBeVisible();
      expect(getContinue()).toBeDisabled();
    });

    it.each([
      {
        case: "a missing XRP balance",
        error: makeNamedError("NotEnoughSpendableBalance", { minimumAmount: "0.200016 XRP" }),
        message: "You need at least 0.200016 XRP to add this asset.",
      },
      {
        case: "an unactivated account",
        error: makeNamedError("XrpAccountNotActivated", { amount: "1.2 XRP" }),
        message: /Receive at least 1.2 XRP to activate it/,
      },
    ])("shows the XRP needed for $case, keeps Continue off, and opens Swap", async params => {
      mockStatus.errors = { amount: params.error };
      const { user, onClose } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByText(params.message)).toBeVisible();
      expect(getContinue()).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "Get XRP" }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      expect(mockNavigate).toHaveBeenCalledWith("/swap", {
        state: expect.objectContaining({
          defaultCurrency: { toCurrencyId: XRP_ACCOUNT.currency.id },
          defaultAccountId: XRP_ACCOUNT.id,
        }),
      });
    });

    it("explains an unactivated account apart from a missing balance", async () => {
      mockStatus.errors = {
        amount: makeNamedError("XrpAccountNotActivated", { amount: "1.2 XRP" }),
      };
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByTestId("xrp-add-asset-not-activated")).toHaveTextContent(
        "Your account isn't activated yet",
      );

      expect(screen.queryByTestId("xrp-add-asset-not-enough-balance")).not.toBeInTheDocument();
    });

    it("shows any other status error, and keeps Continue off", async () => {
      mockStatus.errors = { fee: makeNamedError("FeeNotLoaded") };
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByTestId("xrp-add-asset-error")).toBeVisible();
      expect(getContinue()).toBeDisabled();
    });

    it("shows the bridge error, and keeps Continue off", async () => {
      mockBridge.error = makeNamedError("NetworkDown");
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByTestId("xrp-add-asset-error")).toBeVisible();
      expect(getContinue()).toBeDisabled();
    });

    it("loads the network fee and Continue while the status updates", async () => {
      mockBridge.pending = true;
      const { user } = renderAddAsset();

      await openReview(user, rlusd);

      expect(screen.getByTestId("xrp-add-asset-network-fee-loading")).toBeInTheDocument();
      expect(getContinue()).toBeDisabled();
      expect(within(getContinue()).getByRole("img", { name: /loading/i })).toBeVisible();
    });
  });

  describe("signing", () => {
    it("signs the opt-in with a changed limit and Rippling", async () => {
      const { user } = renderAddAsset();
      await openReview(user, rlusd);

      await user.click(screen.getByTestId("xrp-trust-limit-row"));
      const limitInput = screen.getByTestId("xrp-trust-limit-input");
      await user.clear(limitInput);
      await user.type(limitInput, "1000");
      await user.click(screen.getByTestId("xrp-trust-limit-confirm"));
      await activateRippling(user);

      expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("1,000 RLUSD");
      expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Activated");

      await continueToDevice(user);
      await screen.findByRole("button", { name: "Sign on device" });

      expect(mockSignedInput).toHaveBeenCalledTimes(1);
      const { transaction } = mockSignedInput.mock.calls[0][0];

      expect(transaction).toMatchObject({
        mode: "changeTrust",
        assetReference: rlusd.tokenIdentifier,
        assetOwner: rlusd.contractAddress,
        amount: ONE_RLUSD.times(1000),
        noRipple: false,
      });
    });

    it("goes back to the review with the entered values when the device step is left", async () => {
      const { user } = renderAddAsset();
      await openReview(user, rlusd);

      await activateRippling(user);
      await continueToDevice(user);
      const cancelButton = await screen.findByRole("button", { name: "Cancel on device" });
      await user.click(cancelButton);

      expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Activated");
    });

    it("shows success without an operation link, and closes on Got it", async () => {
      mockBroadcast.mockResolvedValue(signedOperation.operation);
      const { user, onClose } = renderAddAsset();
      await openReview(user, rlusd);

      await continueToDevice(user);
      const signButton = await screen.findByRole("button", { name: "Sign on device" });
      await user.click(signButton);

      const successTitle = await screen.findByText("Asset added");
      expect(successTitle).toBeVisible();
      expect(screen.getByText("You can now receive and use this asset.")).toBeVisible();
      expect(screen.queryByTestId("xrp-signature-view-details")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Got it" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("tracks each step of the flow", async () => {
      mockBroadcast.mockResolvedValue(signedOperation.operation);
      const { user } = renderAddAsset();
      await openReview(user, rlusd);

      await user.click(screen.getByTestId("xrp-trust-limit-row"));
      await user.click(screen.getByTestId("xrp-trust-limit-confirm"));
      await continueToDevice(user);
      const signButton = await screen.findByRole("button", { name: "Sign on device" });
      await user.click(signButton);
      await screen.findByText("Asset added");

      expect(getTrackedScreens()).toEqual([
        "XRP add token Step Token",
        "XRP add token Step Review",
        "XRP add token Step Settings",
        "XRP add token Step Review",
        "XRP add token Step Confirmed",
      ]);
    });

    it("shows the failure, and Try again returns to the review", async () => {
      mockBroadcast.mockRejectedValue(new Error("broadcast failed"));
      const { user } = renderAddAsset();
      await openReview(user, rlusd);

      await continueToDevice(user);
      const signButton = await screen.findByRole("button", { name: "Sign on device" });
      await user.click(signButton);

      const errorTitle = await screen.findByText("Failed to add asset");
      expect(errorTitle).toBeVisible();
      expect(screen.getByText(/Your transaction may have failed/)).toBeVisible();

      expect(getTrackedScreens()).toContain("XRP add token Step Confirmation Error");

      await user.click(screen.getByTestId("xrp-signature-retry"));

      expect(screen.getByRole("dialog", { name: "Review asset details" })).toBeVisible();
    });
  });
});
