import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPortProvider } from "@features/flow-settings";
import { createFakeAssetManagementPort } from "./__tests__/fakeAssetManagementPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { AssetManagement } from "./AssetManagement";
import type { AssetManagementSettingsValues, HiddenTokenGroup } from "./types";

jest.mock("@shared/analytics-react", () => ({ Track: () => null, TrackScreen: () => null }));

const HIDDEN_TOKENS: readonly HiddenTokenGroup[] = [
  {
    network: { id: "ethereum", name: "Ethereum" },
    tokens: [{ id: "ethereum/erc20/usd_tether__erc20_", name: "Tether USD", ticker: "USDT" }],
  },
  {
    network: { id: "polygon", name: "Polygon" },
    tokens: [{ id: "polygon/erc20/usd_coin", name: "USD Coin", ticker: "USDC" }],
  },
];

function renderSection(
  initial?: Partial<AssetManagementSettingsValues>,
  hiddenTokens?: readonly HiddenTokenGroup[],
) {
  const fake = createFakeAssetManagementPort(initial, hiddenTokens);
  render(
    <I18nWrapper>
      <SettingsPortProvider value={fake.port}>
        <AssetManagement testID="settings-assets" />
      </SettingsPortProvider>
    </I18nWrapper>,
  );
  return fake;
}

async function openHiddenTokens(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Manage" }));
  return screen.findByTestId("settings-asset-management-hidden-tokens");
}

describe("AssetManagement (web)", () => {
  it("shows the three rows with their descriptions", () => {
    renderSection();

    expect(screen.getByTestId("settings-assets")).toBeVisible();
    expect(screen.getByText("Hide empty token accounts")).toBeVisible();
    expect(screen.getByText("Hide token accounts with zero balance.")).toBeVisible();
    expect(screen.getByText("Hide token transactions when value is 0")).toBeVisible();
    expect(screen.getByText("Hidden tokens")).toBeVisible();
  });

  it("names each toggle after its row", () => {
    renderSection();

    expect(screen.getByTestId("setting-hideEmptyTokenAccounts-toggle")).toHaveAttribute(
      "aria-label",
      "Hide empty token accounts",
    );
    expect(screen.getByTestId("setting-filterTokenOperationsZeroAmount-toggle")).toHaveAttribute(
      "aria-label",
      "Hide token transactions when value is 0",
    );
  });

  it("lists the hidden tokens under their network in the Manage dialog", async () => {
    const user = userEvent.setup();
    renderSection(undefined, HIDDEN_TOKENS);

    const dialog = await openHiddenTokens(user);

    expect(within(dialog).getByText("Select a token to display it in Ledger Wallet")).toBeVisible();
    expect(within(dialog).getByText("Ethereum")).toBeVisible();
    expect(within(dialog).getByText("Polygon")).toBeVisible();
    expect(
      within(within(dialog).getByTestId("hidden-token-polygon/erc20/usd_coin")).getByText(
        "USD Coin",
      ),
    ).toBeVisible();
  });

  it("shows a hidden token again from its action", async () => {
    const user = userEvent.setup();
    const { showToken } = renderSection(undefined, HIDDEN_TOKENS);

    const dialog = await openHiddenTokens(user);
    await user.click(within(dialog).getByRole("button", { name: "Show Tether USD" }));

    expect(showToken.mock.calls).toEqual([["ethereum/erc20/usd_tether__erc20_"]]);
  });

  it("says when no token is hidden", async () => {
    const user = userEvent.setup();
    renderSection();

    const dialog = await openHiddenTokens(user);

    expect(within(dialog).getByText("You have no hidden tokens.")).toBeVisible();
  });

  it("tells the app once the dialog closes", async () => {
    const user = userEvent.setup();
    const { onHiddenTokensClosed } = renderSection(undefined, HIDDEN_TOKENS);

    await openHiddenTokens(user);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onHiddenTokensClosed).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("settings-asset-management-hidden-tokens")).not.toBeInTheDocument();
  });
});
