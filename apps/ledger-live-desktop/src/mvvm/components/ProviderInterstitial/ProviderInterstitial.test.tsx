import React from "react";

import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useShowProviderLoadingTransition } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";

import { render, screen } from "tests/testSetup";
import { ProviderInterstitial } from ".";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockManifest = {
  id: BUY_SELL_UI_APP_ID,
  name: "Moonpay",
} as LiveAppManifest;

jest.mock("@ledgerhq/live-common/hooks/useShowProviderLoadingTransition", () => ({
  useShowProviderLoadingTransition: jest.fn(),
}));

describe("ProviderInterstitial", () => {
  it("renders nothing if transition hook returns false", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (useShowProviderLoadingTransition as jest.Mock).mockReturnValue(false);
    render(<ProviderInterstitial manifest={mockManifest} isLoading={false} />);
    expect(screen.queryByTestId("custom-buy-sell-loader")).toBeNull();
  });

  it("renders loader when transition hook returns true", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (useShowProviderLoadingTransition as jest.Mock).mockReturnValue(true);
    render(<ProviderInterstitial manifest={mockManifest} isLoading={true} />);

    expect(screen.queryByTestId("custom-buy-sell-loader")).toBeInTheDocument();
    expect(screen.getByText("Connecting you to Moonpay", { exact: false })).toBeTruthy(); // or mock t()
  });
});
