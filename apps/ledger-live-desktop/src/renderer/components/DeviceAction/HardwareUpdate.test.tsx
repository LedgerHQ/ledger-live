import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { HardwareUpdate } from "./rendering";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  useTrack: () => jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const EXPLORE_LABEL = "Explore compatible devices";
const SWAP_PROVIDER_LABEL = "Swap with another provider";

describe("HardwareUpdate - Nano S swap incompatibility analytics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("tracks the page view with the provider variant", () => {
    render(
      <HardwareUpdate
        i18nKeyTitle="swap.wrongDevice.title"
        i18nKeyDescription="swap.wrongDevice.description"
        variant="provider"
        provider="thorswap"
        sourceCurrency="bitcoin"
        targetCurrency="ethereum"
      />,
    );

    expect(trackPage).toHaveBeenCalledWith(
      "Swap Nano S Incompatibility",
      undefined,
      expect.objectContaining({
        flow: "swap",
        deviceModel: "nanoS",
        variant: "provider",
        provider: "thorswap",
        sourceCurrency: "bitcoin",
        targetCurrency: "ethereum",
      }),
      true,
      false,
      false,
    );
  });

  it("tracks the explore compatible devices CTA", () => {
    render(
      <HardwareUpdate
        i18nKeyTitle="swap.wrongDevice.title"
        i18nKeyDescription="swap.wrongDevice.description"
        variant="provider"
        provider="thorswap"
        sourceCurrency="bitcoin"
        targetCurrency="ethereum"
      />,
    );

    fireEvent.click(screen.getByText(EXPLORE_LABEL));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore_compatible_devices",
      page: "Swap Nano S Incompatibility",
      flow: "swap",
      deviceModel: "nanoS",
      variant: "provider",
      provider: "thorswap",
      sourceCurrency: "bitcoin",
      targetCurrency: "ethereum",
    });
    expect(openURL).toHaveBeenCalledWith("https://shop.ledger.com/pages/hardware-wallet");
  });

  it("tracks the swap with another provider CTA", () => {
    render(
      <HardwareUpdate
        i18nKeyTitle="swap.wrongDevice.title"
        i18nKeyDescription="swap.wrongDevice.description"
        variant="provider"
        provider="thorswap"
        sourceCurrency="bitcoin"
        targetCurrency="ethereum"
      />,
    );

    fireEvent.click(screen.getByText(SWAP_PROVIDER_LABEL));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "swap_with_another_provider",
      page: "Swap Nano S Incompatibility",
      flow: "swap",
      deviceModel: "nanoS",
      variant: "provider",
      provider: "thorswap",
      sourceCurrency: "bitcoin",
      targetCurrency: "ethereum",
    });
  });

  it("tracks the currency variant without a provider", () => {
    render(
      <HardwareUpdate
        i18nKeyTitle="swap.incompatibility.ton_title"
        i18nKeyDescription="swap.incompatibility.ton_description"
        variant="currency"
        sourceCurrency="ton"
        targetCurrency="bitcoin"
      />,
    );

    expect(trackPage).toHaveBeenCalledWith(
      "Swap Nano S Incompatibility",
      undefined,
      expect.objectContaining({
        flow: "swap",
        deviceModel: "nanoS",
        variant: "currency",
        sourceCurrency: "ton",
        targetCurrency: "bitcoin",
      }),
      true,
      false,
      false,
    );
    expect(trackPage).not.toHaveBeenCalledWith(
      "Swap Nano S Incompatibility",
      undefined,
      expect.objectContaining({ provider: expect.anything() }),
      true,
      false,
      false,
    );
  });
});
