import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import CurrencyRegionRestrictedDialog from "..";
import {
  openCurrencyRegionRestrictedDialog,
  selectIsCurrencyRegionRestrictedDialogOpen,
} from "../currencyRegionRestrictedDialog";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("CurrencyRegionRestrictedDialog Integration", () => {
  beforeEach(() => {
    (openURL as jest.Mock).mockClear();
  });

  it("does not render a dialog while the dialog state is closed", () => {
    render(<CurrencyRegionRestrictedDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names the restricted currency in the title, description and CTAs", async () => {
    const { store } = render(<CurrencyRegionRestrictedDialog />);

    act(() => {
      store.dispatch(openCurrencyRegionRestrictedDialog("Hyperliquid"));
    });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    expect(screen.getByText("Hyperliquid is not available in your region")).toBeVisible();
    expect(screen.getByText("Access to Hyperliquid is restricted in your region.")).toBeVisible();
    expect(screen.getByTestId("region-restricted-learn-more")).toBeVisible();
    expect(screen.getByTestId("region-restricted-close")).toBeVisible();
  });

  it("opens the compliance article when the Learn more CTA is clicked", async () => {
    const { store, user } = render(<CurrencyRegionRestrictedDialog />);

    act(() => {
      store.dispatch(openCurrencyRegionRestrictedDialog("Hyperliquid"));
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());

    await user.click(screen.getByTestId("region-restricted-learn-more"));

    expect(openURL).toHaveBeenCalledWith(urls.geoBlock.learnMore);
    expect(selectIsCurrencyRegionRestrictedDialogOpen(store.getState())).toBe(true);
  });

  it("closes the dialog when the Close CTA is clicked", async () => {
    const { store, user } = render(<CurrencyRegionRestrictedDialog />);

    act(() => {
      store.dispatch(openCurrencyRegionRestrictedDialog("Hyperliquid"));
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());

    await user.click(screen.getByTestId("region-restricted-close"));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(selectIsCurrencyRegionRestrictedDialogOpen(store.getState())).toBe(false);
  });
});
