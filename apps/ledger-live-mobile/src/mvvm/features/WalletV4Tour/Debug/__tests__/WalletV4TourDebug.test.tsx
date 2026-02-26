import React from "react";
import { render, screen } from "@tests/test-renderer";
import WalletV4TourScreenDebug from "../index";

jest.mock("../../Drawer", () => ({
  useWalletV4TourDrawer: () => ({
    isDrawerOpen: false,
    handleOpenDrawer: jest.fn(),
    handleCloseDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    onSlideChange: jest.fn(),
    slides: [],
  }),
  WalletV4TourDrawer: () => null,
}));

describe("WalletV4TourScreenDebug", () => {
  it("should render intro text and Open Drawer button", () => {
    render(<WalletV4TourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, hasSeenWalletV4Tour: false },
      }),
    });

    expect(screen.getByText(/Allows you to test the UI of the different drawer/)).toBeOnTheScreen();
    expect(screen.getByText("Open Drawer")).toBeOnTheScreen();
  });

  it("should render Tour State section with Has Seen Wallet V4 Tour toggle", () => {
    render(<WalletV4TourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, hasSeenWalletV4Tour: false },
      }),
    });

    expect(screen.getByText("Tour State")).toBeOnTheScreen();
    expect(screen.getByText("Has Seen Wallet V4 Tour")).toBeOnTheScreen();
    expect(screen.getByText("User has not seen the tour yet.")).toBeOnTheScreen();
  });

  it("should show Completed when hasSeenWalletV4Tour is true", () => {
    render(<WalletV4TourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, hasSeenWalletV4Tour: true },
      }),
    });

    expect(screen.getByText(/Tour State: Completed/)).toBeOnTheScreen();
    expect(screen.getByText(/Toggle to reset/)).toBeOnTheScreen();
  });

  it("should show Not seen when hasSeenWalletV4Tour is false", () => {
    render(<WalletV4TourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, hasSeenWalletV4Tour: false },
      }),
    });

    expect(screen.getByText(/Tour State: Not seen/)).toBeOnTheScreen();
  });
});
