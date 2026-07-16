import React from "react";
import { render, screen } from "tests/testSetup";
import OpenDevToolsRow from "./OpenDevToolsRow";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

describe("OpenDevToolsRow", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the DevTools settings row", () => {
    render(<OpenDevToolsRow />);

    expect(screen.getByText("DevTools")).toBeVisible();
    expect(
      screen.getByText("Open the DevTools shell (feature flags and dev tools panel)."),
    ).toBeVisible();
  });

  it("navigates to the devtools route when the button is clicked", async () => {
    const { user } = render(<OpenDevToolsRow />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(mockNavigate).toHaveBeenCalledWith("/devtools");
  });
});
