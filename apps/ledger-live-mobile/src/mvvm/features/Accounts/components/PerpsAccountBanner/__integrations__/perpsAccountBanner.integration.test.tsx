import * as React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { PerpsAccountBanner } from "..";

const hypercore = getCryptoCurrencyById("hypercore");
const bitcoin = getCryptoCurrencyById("bitcoin");

describe("PerpsAccountBanner", () => {
  it("explains the read only account and offers the Perps entry point", async () => {
    render(<PerpsAccountBanner currency={hypercore} />, {
      overrideInitialState: withFlagOverrides({ ptxPerpsLiveAppMobile: { enabled: true } }),
    });

    expect(await screen.findByText("About Hyperliquid account")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "This account is related to Perpetual trading. Transactional actions are not supported for this account",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("perps-account-banner")).toBeOnTheScreen();
  });

  it("stays hidden on a currency that is not hypercore", () => {
    render(<PerpsAccountBanner currency={bitcoin} />, {
      overrideInitialState: withFlagOverrides({ ptxPerpsLiveAppMobile: { enabled: true } }),
    });

    expect(screen.queryByTestId("perps-account-banner")).not.toBeOnTheScreen();
  });

  it("stays hidden when the perps live app is disabled", () => {
    render(<PerpsAccountBanner currency={hypercore} />, {
      overrideInitialState: withFlagOverrides({ ptxPerpsLiveAppMobile: { enabled: false } }),
    });

    expect(screen.queryByTestId("perps-account-banner")).not.toBeOnTheScreen();
  });
});
