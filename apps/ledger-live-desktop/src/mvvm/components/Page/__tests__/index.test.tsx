import React from "react";
import { render, screen } from "tests/testSetup";
import { PageView } from "../PageView";

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
    shouldDisplayBrazePlacement: false,
    pathname: "/dashboard",
    shouldRenderRightPanel: false,
  };

  it("renders Wallet40TopBar", () => {
    render(
      <PageView {...defaultProps}>
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
  });
});
