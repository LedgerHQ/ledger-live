import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getBrazeWebSdkJestMock as mockGetBrazeWebSdkJestMock } from "tests/mocks/brazeWebSdk";
import TopBarView from "../TopBarView";
import { TopBarSlot } from "../types";

jest.mock("electron-store", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  }));
});

jest.mock("@braze/web-sdk", () => mockGetBrazeWebSdkJestMock());

jest.mock("../components/ActionsList", () => ({
  TopBarActionsList: () => null,
}));

jest.mock("~/renderer/components/FirmwareUpdateBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="firmware-update-banner" />,
}));

describe("TopBarView", () => {
  const defaultSlots: TopBarSlot[] = [];
  const defaultProps = {
    slots: defaultSlots,
    isInformationCenterOpen: false,
    onInformationCenterClose: jest.fn(),
    shouldDisplayAggregatedAssets: false,
    shouldDisplayAssetDiscoverability: false,
  };

  it("should render updater when not in manager", () => {
    render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={true} />);

    expect(screen.getByTestId("firmware-update-banner")).toBeInTheDocument();
  });

  it("should not render updater when in manager", () => {
    render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />);

    expect(screen.queryByTestId("firmware-update-banner")).not.toBeInTheDocument();
  });

  it("should render the UserAvatar", () => {
    render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />, {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: { myWallet: true } },
      }),
    });

    expect(screen.getByTestId("my-wallet-avatar")).toBeInTheDocument();
  });

  describe("search input with asset discoverability", () => {
    const assetDiscoverabilityState = withFlagOverrides({
      lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
    });

    it("should not render the search input when the flag is off", () => {
      render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />);

      expect(screen.queryByTestId("topbar-search-input")).not.toBeInTheDocument();
    });

    it.each(["/", "/market"])(
      "should render the global search input on %s when the flag is on",
      route => {
        render(
          <TopBarView
            {...defaultProps}
            shouldShowFirmwareUpdateBanner={false}
            shouldDisplayAssetDiscoverability
          />,
          { initialState: assetDiscoverabilityState, initialRoute: route },
        );

        expect(screen.getByTestId("topbar-search-input")).toBeInTheDocument();
      },
    );

    it("should open the popover when the search input is clicked", async () => {
      const { user } = render(
        <TopBarView
          {...defaultProps}
          shouldShowFirmwareUpdateBanner={false}
          shouldDisplayAssetDiscoverability
        />,
        { initialState: assetDiscoverabilityState, initialRoute: "/" },
      );

      expect(screen.queryByTestId("topbar-search-popover")).not.toBeInTheDocument();

      await user.click(screen.getByRole("textbox"));
      expect(screen.getByTestId("topbar-search-popover")).toBeInTheDocument();
    });

    it("should reset the query on Escape", async () => {
      const { user } = render(
        <TopBarView
          {...defaultProps}
          shouldShowFirmwareUpdateBanner={false}
          shouldDisplayAssetDiscoverability
        />,
        { initialState: assetDiscoverabilityState, initialRoute: "/" },
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "bitcoin");
      expect(input).toHaveValue("bitcoin");

      await user.type(input, "{Escape}");
      expect(input).toHaveValue("");
    });

    it("should keep the popover open and preserve the query when the search input is re-clicked", async () => {
      const { user } = render(
        <TopBarView
          {...defaultProps}
          shouldShowFirmwareUpdateBanner={false}
          shouldDisplayAssetDiscoverability
        />,
        { initialState: assetDiscoverabilityState, initialRoute: "/" },
      );

      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(screen.getByTestId("topbar-search-popover")).toBeInTheDocument();

      await user.type(input, "bitcoin");
      expect(input).toHaveValue("bitcoin");

      await user.click(input);
      expect(screen.getByTestId("topbar-search-popover")).toBeInTheDocument();
      expect(input).toHaveValue("bitcoin");
    });
  });
});
