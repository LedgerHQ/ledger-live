import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import AccountHeaderActions, { AccountHeaderSettingsButton } from "./AccountHeaderActions";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useWalletFeaturesConfig: jest.fn(),
}));
const mockWalletConfig = jest.mocked(useWalletFeaturesConfig);

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isAccountEmpty: () => false,
  }),
}));

jest.mock("@ledgerhq/live-common/account/index", () => {
  const framework = jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index");
  return {
    canSend: jest.fn().mockResolvedValue(true),
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

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("@ledgerhq/live-common/walletConnect/index", () => ({
  isWalletConnectSupported: () => false,
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeUsingLedgerLive: () => false,
    getCanStakeUsingPlatformApp: () => false,
    getRouteToPlatformApp: () => null,
  }),
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
  mockWalletConfig.mockReturnValue({
    shouldDisplayAssetDiscoverability: false,
  } as ReturnType<typeof useWalletFeaturesConfig>);
});

describe("AccountHeaderSettingsButton — legacy star visibility", () => {
  it("renders the legacy star when asset discoverability is off", async () => {
    mockFamily.mockReturnValue({} as never);

    const { container } = render(
      <AccountHeaderSettingsButton account={account} parentAccount={undefined} />,
    );

    await waitFor(() =>
      expect(container.querySelector("#account-star-button")).toBeInTheDocument(),
    );
  });

  it("hides the legacy star when asset discoverability is on", async () => {
    mockFamily.mockReturnValue({} as never);
    mockWalletConfig.mockReturnValue({
      shouldDisplayAssetDiscoverability: true,
    } as ReturnType<typeof useWalletFeaturesConfig>);

    const { container } = render(
      <AccountHeaderSettingsButton account={account} parentAccount={undefined} />,
    );

    await waitFor(() => expect(container.firstChild).toBeInTheDocument());
    expect(container.querySelector("#account-star-button")).not.toBeInTheDocument();
  });
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
});
