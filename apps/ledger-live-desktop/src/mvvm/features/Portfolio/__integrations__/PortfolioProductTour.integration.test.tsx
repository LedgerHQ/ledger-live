import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { getBrazeWebSdkJestMock as mockGetBrazeWebSdkJestMock } from "tests/mocks/brazeWebSdk";
import { useDispatch } from "LLD/hooks/redux";
import { openProductTour } from "LLD/features/ProductTour/Drawer/productTourDialog";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import Portfolio from "../index";

jest.mock("@braze/web-sdk", () => mockGetBrazeWebSdkJestMock());

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

function PortfolioProductTourHarness() {
  const dispatch = useDispatch();

  return (
    <>
      <button type="button" onClick={() => dispatch(openProductTour())}>
        Open Product Tour
      </button>
      <Portfolio />
    </>
  );
}

function renderPortfolioProductTour({ isProductTourEnabled }: { isProductTourEnabled: boolean }) {
  return render(<PortfolioProductTourHarness />, {
    initialRoute: "/",
    initialState: {
      settings: {
        ...AFTER_ONBOARDING_STATE,
        hasSeenWalletV4Tour: true,
      },
      ...withFlagOverrides({
        analyticsOptIn: {
          enabled: false,
        },
        lwdWallet40: {
          enabled: false,
        },
        lwdProductTour: {
          enabled: isProductTourEnabled,
        },
      }),
    },
  });
}

describe("Portfolio Product Tour", () => {
  it("shows Product Tour dialog when lwdProductTour is enabled and opened", async () => {
    const { user } = renderPortfolioProductTour({ isProductTourEnabled: true });

    await user.click(screen.getByRole("button", { name: "Open Product Tour" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
    expect(screen.getByRole("button", { name: "Fund your wallet" })).toBeVisible();
  });

  it("does not show Product Tour dialog when lwdProductTour is disabled and opened", async () => {
    const { user } = renderPortfolioProductTour({ isProductTourEnabled: false });

    await user.click(screen.getByRole("button", { name: "Open Product Tour" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
