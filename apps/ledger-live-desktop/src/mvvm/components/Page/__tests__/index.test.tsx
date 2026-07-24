import React from "react";
import { render, screen } from "tests/testSetup";
import { PageView } from "../PageView";

jest.mock("LLD/components/TopBar", () => ({
  __esModule: true,
  default: () => <div data-testid="wallet40-topbar">Wallet40TopBar</div>,
}));

jest.mock("LLD/components/RightPanel", () => ({
  __esModule: true,
  default: () => null,
}));

describe("PageView - TopBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    pageScrollerRef: jest.fn(),
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
