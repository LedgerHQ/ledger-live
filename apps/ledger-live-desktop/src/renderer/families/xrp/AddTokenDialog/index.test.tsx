import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "tests/testSetup";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import AddTokenDialog from "./index";
import { useTokenOptions } from "../AddTokenModal/useTokenOptions";
import { XRP_ACCOUNT } from "../__mocks__/account.mock";
import { xrpMptToken, xrpRlusdToken } from "../__mocks__/currency.mock";

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
const mockStatus = {
  errors: {} as Record<string, Error>,
  warnings: {} as Record<string, Error>,
  estimatedFees: new BigNumber(12),
};
const mockTransactions: object[] = [];
const mockSignedRequests: { transaction: object }[] = [];
const signedOperation = {
  operation: { id: "op-add", accountId: XRP_ACCOUNT.id, hash: "", type: "OPT_IN" },
  signature: "signature",
} as unknown as SignedOperation;

jest.mock("../AddTokenModal/useTokenOptions", () => ({ useTokenOptions: jest.fn() }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "xrp" }),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => {
  const { useState } = jest.requireActual("react");
  return {
    __esModule: true,
    default: (_: unknown, init: () => { transaction: object }) => {
      const [transaction, setTransaction] = useState(() => init().transaction);
      mockTransactions.push(transaction);
      return {
        transaction,
        updateTransaction: setTransaction,
        status: mockStatus,
        bridgePending: false,
      };
    },
  };
});
jest.mock("@ledgerhq/live-common/families/xrp/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/state-manager/api"),
  useGetIssuerFeeQuery: () => ({ isLoading: false, data: "1" }),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: (_: unknown, input: { transaction: object }, callbacks: unknown) => {
    mockSignedRequests.push(input);
    return { input, callbacks };
  },
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: () => Promise.resolve({}),
  DeviceIntentExecutor: (props: {
    intent: { callbacks: { onResult: (result: SignedOperation) => void } };
    onIntentJobComplete: () => void;
  }) => (
    <button
      onClick={() => {
        props.intent.callbacks.onResult(signedOperation);
        props.onIntentJobComplete();
      }}
    >
      Sign on device
    </button>
  ),
}));

const mockUseTokenOptions = jest.mocked(useTokenOptions);
const loadNext = jest.fn();
const retry = jest.fn();

function mockTokenOptions(overrides: Partial<ReturnType<typeof useTokenOptions>> = {}) {
  mockUseTokenOptions.mockReturnValue({
    options: [xrpRlusdToken, xrpMptToken],
    isLoading: false,
    isError: false,
    loadNext,
    retry,
    ...overrides,
  });
}

function renderDialog() {
  return render(<AddTokenDialog account={XRP_ACCOUNT} parentAccount={null} />, {
    initialState: { accounts: [XRP_ACCOUNT], dialogs: { XRP_ADD_TOKEN: true } },
  });
}

describe("xrp AddTokenDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactions.length = 0;
    mockSignedRequests.length = 0;
    mockStatus.errors = {};
    mockStatus.warnings = {};
    mockTokenOptions();
  });

  it("lists the tokens the account can add, from the account's own options", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Select asset" })).toBeVisible();
    expect(mockUseTokenOptions).toHaveBeenCalledWith(XRP_ACCOUNT);
    expect(screen.getByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`)).toBeVisible();
    expect(screen.getByTestId(`xrp-add-token-option-${xrpMptToken.id}`)).toBeVisible();
  });

  it("filters the list by name or ticker", async () => {
    const { user } = renderDialog();

    await user.type(screen.getByTestId("xrp-add-token-search"), "tmpt");

    expect(screen.getByTestId(`xrp-add-token-option-${xrpMptToken.id}`)).toBeVisible();
    expect(
      screen.queryByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`),
    ).not.toBeInTheDocument();
  });

  it("says when no token is left to add", () => {
    mockTokenOptions({ options: [] });
    renderDialog();

    expect(screen.getByText("No token is available to add to this account.")).toBeVisible();
  });

  it("offers a retry when the token list fails to load", async () => {
    mockTokenOptions({ options: [], isError: true });
    const { user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("loads the next page when the list is scrolled to its end", () => {
    renderDialog();

    const body = screen.getByRole("dialog").querySelector('[data-slot="dialog-body"]');
    fireEvent.scroll(body as Element);

    expect(loadNext).toHaveBeenCalled();
  });

  it("goes to the review of the picked token, and back to the list", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`));

    expect(screen.getByRole("dialog", { name: "Review asset details" })).toBeVisible();
    expect(mockTransactions.at(-1)).toMatchObject({
      mode: "changeTrust",
      assetReference: xrpRlusdToken.tokenIdentifier,
      assetOwner: xrpRlusdToken.contractAddress,
    });

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByRole("dialog", { name: "Select asset" })).toBeVisible();
  });

  it("reviews an IOU with its details, fees and trust settings", async () => {
    mockStatus.warnings = {
      reserve: Object.assign(new Error(), { name: "XrpReserveIncrease", amount: "0.2 XRP" }),
    };
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`));

    expect(screen.getByText("Trust Line (IOU)")).toBeVisible();
    expect(screen.getByText("1% per transaction")).toBeVisible();
    expect(screen.getByTestId("xrp-add-token-network-fee")).toHaveTextContent("0.000012 XRP ·");
    expect(screen.getByTestId("xrp-add-token-locked-amount")).toHaveTextContent("0.2 XRP ·");
    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("Maximum");
    expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Deactivated");
  });

  it("shows 0 XRP locked when the add locks no reserve", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`));

    expect(screen.getByTestId("xrp-add-token-locked-amount")).toHaveTextContent("0 XRP ·");
  });

  it("reviews an MPT without trust settings", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpMptToken.id}`));

    expect(screen.getByText("Multi Purpose Token")).toBeVisible();
    expect(screen.queryByTestId("xrp-trust-limit-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("xrp-trust-rippling-row")).not.toBeInTheDocument();
  });

  it("signs the limit and rippling chosen on the review", async () => {
    mockBroadcast.mockResolvedValue(signedOperation.operation);
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpRlusdToken.id}`));
    await user.click(screen.getByTestId("xrp-trust-limit-row"));
    await user.clear(screen.getByTestId("xrp-trust-limit-input"));
    await user.type(screen.getByTestId("xrp-trust-limit-input"), "500");
    await user.click(screen.getByTestId("xrp-trust-limit-confirm"));
    await user.click(screen.getByTestId("xrp-trust-rippling-row"));
    await user.click(await screen.findByRole("menuitemradio", { name: "Activated" }));
    await user.click(screen.getByTestId("xrp-add-token-review-continue"));

    expect(mockSignedRequests.at(-1)?.transaction).toMatchObject({
      noRipple: false,
      amount: new BigNumber(500).shiftedBy(xrpRlusdToken.units[0].magnitude),
    });
  });

  it("signs the picked token and shows the added asset", async () => {
    mockBroadcast.mockResolvedValue(signedOperation.operation);
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpMptToken.id}`));
    await user.click(screen.getByTestId("xrp-add-token-review-continue"));
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));

    expect(await screen.findByText("Asset added")).toBeVisible();
    expect(screen.getByText("You can now make transactions with this asset.")).toBeVisible();
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the account page unmounts, so the next account page opens without it", () => {
    const { store, unmount } = renderDialog();

    unmount();

    expect(store.getState().dialogs.XRP_ADD_TOKEN).toBe(false);
  });

  it("shows a failed add with its reason, and Try again goes back to the review", async () => {
    mockStatus.errors = {
      amount: Object.assign(new Error(), { name: "XrpTrustLimitTooHigh" }),
    };
    const { user } = renderDialog();

    await user.click(screen.getByTestId(`xrp-add-token-option-${xrpMptToken.id}`));
    await user.click(screen.getByTestId("xrp-add-token-review-continue"));

    expect(screen.getByText("Failed to add asset")).toBeVisible();
    expect(screen.getByText("The limit is above the maximum")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("dialog", { name: "Review asset details" })).toBeVisible();
  });
});
