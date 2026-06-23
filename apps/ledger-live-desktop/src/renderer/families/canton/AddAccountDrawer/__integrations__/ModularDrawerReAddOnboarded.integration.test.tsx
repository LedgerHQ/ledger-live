/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import ModularDrawerAddAccountFlowManager from "../../ModularDrawerAddAccountFlowManager";
import { createMockAccount } from "../../__tests__/testUtils";

// Drive the flow with trivial stand-ins for each step so the test exercises only the
// flow manager's branching/dispatch (LIVE-32985), not device/scan/UI internals.
jest.mock("../CantonDisclaimer", () => ({
  __esModule: true,
  default: ({ onAgree }: any) =>
    React.createElement("button", { "data-testid": "disclaimer-agree", onClick: onAgree }, "agree"),
}));

jest.mock("LLD/features/AddAccountDrawer/screens/ConnectYourDevice", () => ({
  __esModule: true,
  default: ({ onConnect }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "connect-device",
        onClick: () => onConnect({ device: { deviceId: "test-device-id" } }),
      },
      "connect",
    ),
}));

jest.mock("LLD/features/AddAccountDrawer/screens/ScanAccounts", () => ({
  __esModule: true,
  default: ({ onComplete }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "scan-complete",
        onClick: () => onComplete((globalThis as any).__cantonScannedAccounts ?? []),
      },
      "complete",
    ),
}));

jest.mock("LLD/features/AddAccountDrawer/screens/AccountsAdded", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "accounts-added" }, "added"),
}));

function cantonDevnetCurrency() {
  const currency = getCryptoCurrencyById("canton_network_devnet");
  if (!currency) throw new Error("canton_network_devnet is missing");
  return currency;
}

function buildOnboardedAccount(): Account {
  return createMockAccount({
    id: "js:2:canton_network_devnet:onboarded-party::canton",
    used: false,
    xpub: "onboarded-party",
    cantonResources: {
      isOnboarded: true,
      instrumentUtxoCounts: {},
      pendingTransferProposals: [],
    },
  } as Partial<Account>);
}

describe("Canton MAD — re-adding an already-onboarded account (LIVE-32985)", () => {
  afterEach(() => {
    delete (globalThis as any).__cantonScannedAccounts;
  });

  it("persists an already-onboarded account via the non-onboarding path (no onboarding step)", async () => {
    const onboarded = buildOnboardedAccount();
    (globalThis as any).__cantonScannedAccounts = [onboarded];

    const { user, store } = render(
      <ModularDrawerAddAccountFlowManager currency={cantonDevnetCurrency()} />,
      { initialState: { accounts: [] } },
    );

    await user.click(screen.getByTestId("disclaimer-agree"));
    await user.click(screen.getByTestId("connect-device"));
    await user.click(screen.getByTestId("scan-complete"));

    // addAccountsAction was dispatched and reduced into the accounts state, and the flow
    // landed on the success screen without routing through onboarding.
    await waitFor(() => {
      expect(store.getState().accounts.map((a: Account) => a.id)).toContain(onboarded.id);
    });
    expect(screen.getByTestId("accounts-added")).toBeVisible();
  });
});
