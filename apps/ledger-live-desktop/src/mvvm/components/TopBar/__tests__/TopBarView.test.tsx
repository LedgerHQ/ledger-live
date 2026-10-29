import React from "react";
import { render, screen } from "tests/testSetup";
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
    render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />);

    expect(screen.getByTestId("my-wallet-avatar")).toBeInTheDocument();
  });

  describe("search input", () => {
    it.each(["/", "/market"])("should render the global search input on %s", route => {
      render(<TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />, {
        initialRoute: route,
      });

      expect(screen.getByTestId("topbar-search-input")).toBeInTheDocument();
    });

    it("should open the popover when the search input is clicked", async () => {
      const { user } = render(
        <TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />,
        { initialRoute: "/" },
      );

      expect(screen.queryByTestId("topbar-search-popover")).not.toBeInTheDocument();

      await user.click(screen.getByRole("textbox"));
      expect(screen.getByTestId("topbar-search-popover")).toBeInTheDocument();
    });

    it("should reset the query on Escape", async () => {
      const { user } = render(
        <TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />,
        { initialRoute: "/" },
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "bitcoin");
      expect(input).toHaveValue("bitcoin");

      await user.type(input, "{Escape}");
      expect(input).toHaveValue("");
    });

    it("should keep the popover open and preserve the query when the search input is re-clicked", async () => {
      const { user } = render(
        <TopBarView {...defaultProps} shouldShowFirmwareUpdateBanner={false} />,
        { initialRoute: "/" },
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
