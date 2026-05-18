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
});
