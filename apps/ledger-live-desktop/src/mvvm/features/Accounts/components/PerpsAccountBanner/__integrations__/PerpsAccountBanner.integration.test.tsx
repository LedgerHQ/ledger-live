import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { PerpsAccountBanner } from "..";

const hypercore = getCryptoCurrencyById("hypercore");
const bitcoin = getCryptoCurrencyById("bitcoin");

describe("PerpsAccountBanner Integration", () => {
  it("explains the read only account and offers the Perps entry point", () => {
    render(<PerpsAccountBanner currency={hypercore} />, {
      initialState: withFlagOverrides({ ptxPerpsLiveApp: { enabled: true } }),
    });

    expect(screen.getByText("About Hyperliquid account")).toBeVisible();
    expect(
      screen.getByText(
        "This account is related to Perpetual trading. Transactional actions are not supported for this account",
      ),
    ).toBeVisible();
    expect(screen.getByTestId("perps-account-banner")).toBeVisible();
  });

  it("stays hidden on a currency that is not hypercore", () => {
    render(<PerpsAccountBanner currency={bitcoin} />, {
      initialState: withFlagOverrides({ ptxPerpsLiveApp: { enabled: true } }),
    });

    expect(screen.queryByTestId("perps-account-banner")).not.toBeInTheDocument();
  });

  it("stays hidden when the perps live app is disabled", () => {
    render(<PerpsAccountBanner currency={hypercore} />, {
      initialState: withFlagOverrides({ ptxPerpsLiveApp: { enabled: false } }),
    });

    expect(screen.queryByTestId("perps-account-banner")).not.toBeInTheDocument();
  });
});
