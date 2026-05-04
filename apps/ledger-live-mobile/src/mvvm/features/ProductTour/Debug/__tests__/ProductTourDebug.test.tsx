import React from "react";
import { render, screen } from "@tests/test-renderer";
import ProductTourScreenDebug from "../index";

jest.mock("../../Drawer", () => ({
  useProductTourDrawer: () => ({
    isDrawerOpen: false,
    openDrawer: jest.fn(),
    handleCloseDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    onSlideChange: jest.fn(),
  }),
  ProductTourDrawer: () => null,
}));

describe("ProductTourScreenDebug", () => {
  it("should render intro text and Open Drawer button", () => {
    render(<ProductTourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, productTourCompleted: false },
      }),
    });

    expect(
      screen.getByText(/Allows you to test the UI of the Product Tour drawer/),
    ).toBeOnTheScreen();
    expect(screen.getByText("Open Drawer")).toBeVisible();
  });

  it("should render Tour State section with Product Tour Completed toggle", () => {
    render(<ProductTourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, productTourCompleted: false },
      }),
    });

    expect(screen.getByText("Tour State")).toBeVisible();
    expect(screen.getByText("Product Tour Completed")).toBeVisible();
    expect(screen.getByText("Tour has not been completed yet.")).toBeVisible();
  });

  it("should show Completed state when productTourCompleted is true", () => {
    render(<ProductTourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, productTourCompleted: true },
      }),
    });

    expect(screen.getByText(/Tour State: Completed/)).toBeVisible();
    expect(screen.getByText(/Toggle to reset/)).toBeVisible();
  });

  it("should show Not completed state when productTourCompleted is false", () => {
    render(<ProductTourScreenDebug />, {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, productTourCompleted: false },
      }),
    });

    expect(screen.getByText(/Tour State: Not completed/)).toBeVisible();
  });
});
