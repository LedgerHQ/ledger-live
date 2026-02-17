import React from "react";
import { render, screen } from "tests/testSetup";
import { PageView } from "../PageView";

// Only mock TopBar components to verify which one is rendered
jest.mock("~/renderer/components/TopBar", () => ({
  __esModule: true,
  default: () => <div data-testid="classic-topbar">ClassicTopBar</div>,
}));

jest.mock("LLD/components/TopBar", () => ({
  __esModule: true,
  default: () => <div data-testid="wallet40-topbar">Wallet40TopBar</div>,
}));

// Mock components that have complex dependencies
jest.mock("~/renderer/screens/dashboard/ActionContentCards", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("LLD/components/RightPanel", () => ({
  __esModule: true,
  default: () => null,
}));

describe("PageView - TopBar", () => {
  const defaultProps = {
    pageScrollerRef: jest.fn(),
    isScrollUpButtonVisible: false,
    isScrollAtUpperBound: true,
    isWallet40Enabled: false,
    pathname: "/dashboard",
    onClickScrollUp: jest.fn(),
    shouldRenderRightPanel: false,
  };

  it("renders ClassicTopBar when shouldDisplayWallet40MainNav is false", () => {
    render(
      <PageView {...defaultProps} shouldDisplayWallet40MainNav={false}>
        <div>Test Content</div>
      </PageView>,
      {
        initialState: {
          application: { hasPassword: false },
          accounts: [],
          settings: { discreetMode: false },
        },
      },
    );

    expect(screen.getByTestId("classic-topbar")).toBeVisible();
    expect(screen.queryByTestId("wallet40-topbar")).toBeNull();
  });

  it("renders Wallet40TopBar when shouldDisplayWallet40MainNav is true", () => {
    render(
      <PageView {...defaultProps} isWallet40Enabled={true} shouldDisplayWallet40MainNav={true}>
        <div>Test Content</div>
      </PageView>,
      {
        initialState: {
          application: { hasPassword: false },
          accounts: [],
          settings: { discreetMode: false },
        },
      },
    );

    expect(screen.getByTestId("wallet40-topbar")).toBeVisible();
    expect(screen.queryByTestId("classic-topbar")).toBeNull();
  });
});
