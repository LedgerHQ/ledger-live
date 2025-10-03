import React from "react";

import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useShowProviderLoadingTransition } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";

import { ProviderInterstitial } from ".";

const mockManifest = {
  id: BUY_SELL_UI_APP_ID,
  name: "Moonpay",
} as LiveAppManifest;

jest.mock("@ledgerhq/live-common/hooks/useShowProviderLoadingTransition", () => ({
  useShowProviderLoadingTransition: jest.fn(),
}));

describe("ProviderInterstitial", () => {
  it("renders nothing if transition hook returns false", () => {
    (useShowProviderLoadingTransition as jest.Mock).mockReturnValue(false);
    render(<ProviderInterstitial manifest={mockManifest} isLoading={false} />);
    expect(screen.queryByTestId("custom-buy-sell-loader")).toBeNull();
  });

  it("renders loader when transition hook returns true", () => {
    (useShowProviderLoadingTransition as jest.Mock).mockReturnValue(true);
    render(<ProviderInterstitial manifest={mockManifest} isLoading={true} />);

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeTruthy();
    expect(screen.getByText("Connecting you to Moonpay", { exact: false })).toBeTruthy(); // or mock t()
  });
});
