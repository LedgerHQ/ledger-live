import React from "react";
import {
  act,
  renderWithMockedCounterValuesProvider,
  fireEvent,
  screen,
  waitFor,
  render,
  within,
} from "tests/testSetup";
import { useNavigate } from "react-router";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { track, trackPage } from "~/renderer/analytics/segment";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { payCardFeatureTourInitialState } from "@features/flow-pay-feature-tour/state";
import PayTab from "LLD/features/PayTab";
import { usePayStablecoins, type PayStablecoins } from "../hooks/usePayStablecoins";
import { USDC, makeItem } from "../hooks/__tests__/fixtures";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FEATURE_TOUR_ROW,
  INIT_INPUT,
  USDC_TOKEN,
  defaultPayStablecoins,
  dieEnabledState,
  fundedState,
  newSendFlowEnabledState,
  onboardedState,
  tourSeenState,
} from "./fixtures";
import {
  aliceContact,
  CONTACT_HISTORY_ID,
  CONTACT_HISTORY_NAME,
  createEthAccountWithContactTransfers,
} from "../../History/__integrations__/contactHistory.fixtures";

const mockNavigate = jest.fn();

jest.mock("../hooks/usePayStablecoins", () => ({
  usePayStablecoins: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedTrackPage = jest.mocked(trackPage);
const mockedTrack = jest.mocked(track);
const mockedUsePayStablecoins = jest.mocked(usePayStablecoins);

function mockPayStablecoins(overrides: Partial<PayStablecoins> = {}) {
  mockedUsePayStablecoins.mockReturnValue({
    ...defaultPayStablecoins,
    ...overrides,
  });
}

function mockFundedPayStablecoins() {
  mockPayStablecoins({
    stablecoins: [makeItem(USDC.id, USDC.ticker, USDC.name, 1000)],
  });
}

type CapturedExecutor = {
  sourceFlow: string;
  intent: { input: { expectedAddress: string } };
  onIntentJobStateChanged: (jobState: VerifyAddressIntentJobState) => void;
};

let capturedExecutor: CapturedExecutor | undefined;

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutorLWD: (props: CapturedExecutor) => {
    capturedExecutor = props;
    return <div data-testid="device-intent-executor" />;
  },
}));

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: jest.fn(),
}));

const mockedBuildInit = jest.mocked(buildDeviceInitializationInput);
const mockedUseOpenAssetAndAccount = jest.mocked(useOpenAssetAndAccount);

let openAssetAndAccount: jest.Mock;

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedExecutor = undefined;
    mockPayStablecoins();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    openAssetAndAccount = jest.fn();
    mockedUseOpenAssetAndAccount.mockReturnValue({
      openAssetAndAccount,
      openAssetAndAccountPromise: jest.fn(),
    });
    mockedBuildInit.mockResolvedValue(INIT_INPUT);
  });

  it("should show the feature tour on first visit", () => {
    render(<PayTab />, {
      initialState: {
        payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: false },
      },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
    expect(screen.getByRole("button", { name: "Got it" })).toBeVisible();
  });

  it("should persist dismissal and hide the tour after clicking Got it", async () => {
    const { user, store } = render(<PayTab />, {
      initialState: {
        payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: false },
      },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
      expect(screen.queryByText(FEATURE_TOUR_ROW)).not.toBeInTheDocument();
    });
  });

  it("should not show the feature tour once it has been seen", () => {
    render(<PayTab />, {
      initialState: tourSeenState,
    });

    expect(screen.queryByText(FEATURE_TOUR_ROW)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument();
  });

  it("should render the empty hero when the user holds no stablecoins", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
  });

  it("should render the aggregated stablecoin balance when the user holds USDC", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState },
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
    });
  });

  it("should track the Pay page with the active balance filter on view", () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(mockedTrackPage).toHaveBeenCalledWith(
      "Pay",
      undefined,
      expect.objectContaining({ balance_filter: "all" }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should leave the card and its login to the right panel", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("should open the balance filter dialog from the hero pill and track the interaction", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    });

    fireEvent.click(screen.getByTestId("pay-card-balance-filter-pill"));

    const dialog = await screen.findByTestId("pay-card-balance-filter-picker");
    expect(dialog).toHaveTextContent("USD Coin");
    expect(dialog).toHaveTextContent("Tether USD");
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });

  it("should open the deposit options dialog from the deposit action tile", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    const depositTile = await screen.findByRole("button", { name: "Add stablecoin" });
    fireEvent.click(depositTile);

    expect(await screen.findByTestId("pay-card-deposit-options")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-swap")).toBeVisible();
  });

  it("should open the stablecoin-filtered send account selection from the new payment action tile", async () => {
    mockFundedPayStablecoins();

    const { store } = renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: newSendFlowEnabledState,
    });

    const payTile = await screen.findByRole("button", { name: "New payment" });
    fireEvent.click(payTile);

    await waitFor(() => {
      expect(store.getState().modularDialog.isOpen).toBe(true);
    });
    expect(store.getState().modularDialog.flow).toBe("send");
    expect(store.getState().modularDialog.source).toBe("Pay");
    expect(store.getState().modularDialog.dialogParams?.categories).toEqual([
      AssetCategory.Stablecoins,
    ]);
  });

  it("should persist the selected stablecoin, update the hero pill and track the confirmation", async () => {
    mockFundedPayStablecoins();

    const { store } = renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    });

    fireEvent.click(screen.getByTestId("pay-card-balance-filter-pill"));

    fireEvent.click(await screen.findByTestId("pay-card-balance-filter-option-usdc"));
    fireEvent.click(screen.getByTestId("pay-card-balance-filter-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("pay-card-balance-filter-picker")).not.toBeInTheDocument();
    });

    expect(store.getState().payCardBalance.balanceFilter).toBe(USDC.id);

    const pill = screen.getByTestId("pay-card-balance-filter-pill");
    expect(within(pill).getByText("USDC")).toBeVisible();

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "USDC",
    });
  });

  it("should mount the DIE on verify and restore the request card once the address is confirmed", async () => {
    mockFundedPayStablecoins();
    const { user } = renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: dieEnabledState,
    });

    await user.click(await screen.findByRole("button", { name: "Request" }));
    const { onSuccess } = openAssetAndAccount.mock.calls[0][0] as {
      onSuccess: (account: TokenAccount, parentAccount: typeof ETH_ACCOUNT_WITH_USDC) => void;
    };
    act(() => onSuccess(USDC_TOKEN, ETH_ACCOUNT_WITH_USDC));

    await user.click(await screen.findByTestId("pay-request-receive-verify"));
    await user.click(await screen.findByTestId("pay-card-verify-address-verify-cta"));

    await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
    expect(capturedExecutor?.sourceFlow).toBe("receive");
    expect(capturedExecutor?.intent.input.expectedAddress).toBe(ETH_ACCOUNT_WITH_USDC.freshAddress);

    act(() => {
      capturedExecutor!.onIntentJobStateChanged({
        type: "verified",
        address: ETH_ACCOUNT_WITH_USDC.freshAddress,
      });
    });

    expect(await screen.findByTestId("pay-request-receive")).toBeVisible();
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("should count send and receive transfers with a contact and open History from View transactions", async () => {
    const account = createEthAccountWithContactTransfers();
    const { user } = render(<PayTab />, {
      initialRoute: "/paytab",
      initialState: {
        ...onboardedState,
        ...tourSeenState,
        accounts: [account],
        contacts: { contacts: [aliceContact()] },
      },
    });

    expect(await screen.findByTestId(`pay-contacts-tile-${CONTACT_HISTORY_ID}`)).toBeVisible();
    expect(screen.getByText(CONTACT_HISTORY_NAME)).toBeVisible();
    expect(screen.getByText("2 transactions")).toBeVisible();

    const moreButton = screen.getByRole("button", { name: "More options" });
    expect(moreButton).toBeEnabled();
    await user.click(moreButton);
    await user.click(await screen.findByRole("menuitem", { name: "View transactions" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/history?contactId=${CONTACT_HISTORY_ID}`,
      expect.objectContaining({
        state: { historyBackPath: "/paytab" },
      }),
    );
  });
});
