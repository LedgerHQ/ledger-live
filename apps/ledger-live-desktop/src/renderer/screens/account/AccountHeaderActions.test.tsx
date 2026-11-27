import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import AccountHeaderActions from "./AccountHeaderActions";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isAccountEmpty: () => false,
  }),
}));

jest.mock("@ledgerhq/live-common/account/index", () => {
  const framework = jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index");
  // hypercore disables both send and receive; every other family allows them.
  const allowsTransfer = (account: unknown, parentAccount: unknown) =>
    framework.getMainAccount(account, parentAccount).currency.family !== "hypercore";
  return {
    canSend: jest.fn((account, parentAccount) =>
      Promise.resolve(allowsTransfer(account, parentAccount)),
    ),
    canReceive: (account: unknown, parentAccount: unknown) =>
      allowsTransfer(account, parentAccount),
    isSwapDisabledForFamily: (family: string) => family === "hypercore",
    getMainAccount: framework.getMainAccount,
    getAccountCurrency: framework.getAccountCurrency,
    flattenAccounts: framework.flattenAccounts,
    isUpToDateAccount: framework.isUpToDateAccount,
    accountPersistedStateChanged: jest.fn(() => false),
    accountsPersistedStateChanged: jest.fn(() => false),
  };
});

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/index", () => ({
  getAvailableProviders: () => [],
}));

const mockSwappableIds: string[] = [];
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: mockSwappableIds }),
}));

jest.mock("@ledgerhq/live-common/walletConnect/index", () => ({
  isWalletConnectSupported: () => false,
}));

const mockStake = {
  nativeFlow: false,
  platformApp: false,
  route: null as { pathname: string; state: Record<string, unknown> } | null,
};
jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeUsingLedgerLive: () => mockStake.nativeFlow,
    getCanStakeUsingPlatformApp: () => mockStake.platformApp,
    getRouteToPlatformApp: () => mockStake.route,
  }),
}));

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => jest.fn(),
}));

jest.mock("LLD/features/Send/hooks/useNewSendFlowFeature", () => ({
  useNewSendFlowFeature: () => ({
    isEnabledForFamily: () => false,
    getFamilyFromAccount: () => "bitcoin",
    getCurrencyIdFromAccount: () => "bitcoin",
  }),
}));

jest.mock("~/renderer/screens/exchange/Swap2/utils/index", () => ({
  useGetSwapTrackingProperties: () => ({}),
}));

const btc = getCryptoCurrencyById("bitcoin");
const account = genAccount("test-btc-account", { currency: btc }) as Account;

beforeEach(() => {
  jest.clearAllMocks();
  mockSwappableIds.length = 0;
  Object.assign(mockStake, { nativeFlow: false, platformApp: false, route: null });
});

describe("AccountHeaderActions — family slot / fallback logic", () => {
  it("renders the custom SendAction when the family provides one", async () => {
    mockFamily.mockReturnValue({
      accountActions: { SendAction: () => <div data-testid="custom-send" /> },
    } as never);

    render(<AccountHeaderActions account={account} parentAccount={undefined} />);

    await waitFor(() => expect(screen.getByTestId("custom-send")).toBeVisible());
  });

  it("renders the default send and receive buttons when the family provides no accountActions", async () => {
    mockFamily.mockReturnValue({} as never);

    render(<AccountHeaderActions account={account} parentAccount={undefined} />);

    await waitFor(() => expect(screen.getByTestId("send-button")).toBeVisible());
    expect(screen.getByTestId("receive-account-action-button")).toBeVisible();
  });

  it("hides both send and receive for a family that disables them (hypercore)", async () => {
    mockFamily.mockReturnValue({} as never);
    const hypercoreAccount = genAccount("test-hypercore-account", {
      currency: getCryptoCurrencyById("hypercore"),
    }) as Account;

    render(<AccountHeaderActions account={hypercoreAccount} parentAccount={undefined} />);

    await waitFor(() =>
      expect(screen.queryByTestId("receive-account-action-button")).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId("send-button")).not.toBeInTheDocument();
    // The whole row is gone, not just its buttons: an empty wrapper would still carry its spacing.
    expect(screen.queryByTestId("account-buttons-group")).not.toBeInTheDocument();
  });

  it("shows swap for a swappable currency", async () => {
    mockFamily.mockReturnValue({} as never);
    mockSwappableIds.push("bitcoin");

    render(<AccountHeaderActions account={account} parentAccount={undefined} />);

    await waitFor(() => expect(screen.getByTestId("swap-account-action-button")).toBeVisible());
  });

  it("hides swap for hypercore even when the swap backend lists it", async () => {
    mockFamily.mockReturnValue({} as never);
    mockSwappableIds.push("hypercore");
    const hypercoreAccount = genAccount("test-hypercore-account", {
      currency: getCryptoCurrencyById("hypercore"),
    }) as Account;

    render(<AccountHeaderActions account={hypercoreAccount} parentAccount={undefined} />);

    await waitFor(() =>
      expect(screen.queryByTestId("account-buttons-group")).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId("swap-account-action-button")).not.toBeInTheDocument();
  });
});

const solanaAccount = (spendableLamports: number) =>
  ({
    ...genAccount("test-solana-account", {
      currency: getCryptoCurrencyById("solana"),
      operationsSize: 0,
      subAccountsCount: 0,
    }),
    balance: new BigNumber(spendableLamports),
    spendableBalance: new BigNumber(spendableLamports),
  }) as Account;

describe("AccountHeaderActions: the stake button of a platform app, as the Earn redirect of Solana", () => {
  const earnRoute = {
    pathname: "/earn",
    state: { appId: "earn", intent: "deposit", cryptoAssetId: "solana", accountId: "wallet-id" },
  };
  const nativeStakeAction = {
    key: "Stake",
    label: "Native stake",
    onClick: jest.fn(),
    icon: () => <span />,
    accountActionsTestId: "native-stake-button",
  };

  it("stays on the page, disabled, and goes nowhere when nothing is spendable", async () => {
    mockFamily.mockReturnValue({} as never);
    Object.assign(mockStake, { platformApp: true, route: null });

    const { user } = render(
      <AccountHeaderActions account={solanaAccount(0)} parentAccount={undefined} />,
    );
    const button = await screen.findByTestId("stake-button");
    await user.click(button);

    expect(button).toBeDisabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the route of the platform app when funds are spendable", async () => {
    mockFamily.mockReturnValue({} as never);
    Object.assign(mockStake, { platformApp: true, route: earnRoute });

    const { user } = render(
      <AccountHeaderActions account={solanaAccount(5_000_000_000)} parentAccount={undefined} />,
    );
    const button = await screen.findByTestId("stake-button");
    await user.click(button);

    expect(button).toBeEnabled();
    expect(mockNavigate).toHaveBeenCalledWith("/earn", { state: earnRoute.state });
  });

  it("replaces the native stake action of the family, which stays for a host without the redirect", async () => {
    mockFamily.mockReturnValue({ accountHeaderManageActions: () => [nativeStakeAction] } as never);
    Object.assign(mockStake, { nativeFlow: true, platformApp: true, route: earnRoute });
    const { unmount } = render(
      <AccountHeaderActions account={solanaAccount(5_000_000_000)} parentAccount={undefined} />,
    );
    await screen.findByTestId("stake-button");
    expect(screen.queryByTestId("native-stake-button")).not.toBeInTheDocument();
    unmount();

    Object.assign(mockStake, { nativeFlow: true, platformApp: false, route: null });
    render(
      <AccountHeaderActions account={solanaAccount(5_000_000_000)} parentAccount={undefined} />,
    );

    expect(await screen.findByTestId("native-stake-button")).toBeVisible();
    expect(screen.queryByTestId("stake-button")).not.toBeInTheDocument();
  });
});
