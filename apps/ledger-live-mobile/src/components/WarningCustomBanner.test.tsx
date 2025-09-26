import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import WarningCustomBanner from "./WarningCustomBanner";
import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";

describe("WarningCustomBanner", () => {
  it("renders nothing if currencyConfig is not provided", () => {
    render(<WarningCustomBanner />);
    expect(screen.queryByTestId("generic-banner")).toBeNull();
  });

  it("renders nothing if currencyConfig does not contain a banner", () => {
    const cfg = {} as unknown as CurrencyConfig;
    render(<WarningCustomBanner currencyConfig={cfg} />);
    expect(screen.queryByTestId("generic-banner")).toBeNull();
  });

  it("renders nothing if banner.isDisplay is false", () => {
    const cfg: CurrencyConfig = {
      customBanner: {
        isDisplay: false,
        bannerText: "Migration in progress",
        bannerLink: "https://example.com",
        bannerLinkText: "Learn more",
      },
      status: {
        type: "active",
      },
    };

    render(<WarningCustomBanner currencyConfig={cfg} />);
    expect(screen.queryByTestId("generic-banner")).toBeNull();
  });

  it("renders the banner when isDisplay is true, with text and link", () => {
    const bannerText = "Network maintenance scheduled for October 1st.";
    const bannerLinkText = "Learn more";
    const cfg: CurrencyConfig = {
      customBanner: {
        isDisplay: true,
        bannerText,
        bannerLink: "https://status.example.com",
        bannerLinkText,
      },
      status: {
        type: "active",
      },
    };

    render(<WarningCustomBanner currencyConfig={cfg} />);

    expect(screen.getByTestId("generic-banner")).toHaveTextContent(bannerText + bannerLinkText);
  });

  it("renders the banner even without bannerLinkText (minimal fallback)", () => {
    const bannerText = "Important announcement without link text.";
    const cfg: CurrencyConfig = {
      customBanner: {
        isDisplay: true,
        bannerText,
      },
      status: {
        type: "active",
      },
    };

    render(<WarningCustomBanner currencyConfig={cfg} />);

    expect(screen.getByTestId("generic-banner")).toHaveTextContent(bannerText);
  });
});
