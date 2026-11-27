import React from "react";
import { useNavigate } from "react-router";
import { render, screen } from "tests/testSetup";
import { DatadogRouteViews } from "./DatadogRouteViews";
import { startDatadogRouteView } from "./renderer";

jest.mock("./renderer", () => ({
  startDatadogRouteView: jest.fn(),
}));

const mockStartDatadogRouteView = jest.mocked(startDatadogRouteView);

function NavigateTo({ path }: Readonly<{ path: string }>) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(path)}>{path}</button>;
}

describe("DatadogRouteViews", () => {
  beforeEach(() => {
    mockStartDatadogRouteView.mockClear();
  });

  it("should report the route shown on mount", () => {
    render(<DatadogRouteViews />, { initialRoute: "/accounts" });

    expect(mockStartDatadogRouteView).toHaveBeenCalledTimes(1);
    expect(mockStartDatadogRouteView).toHaveBeenCalledWith("/accounts");
  });

  it("should report each route the user navigates to", async () => {
    const { user } = render(
      <>
        <DatadogRouteViews />
        <NavigateTo path="/manager" />
      </>,
      { initialRoute: "/accounts" },
    );

    await user.click(screen.getByRole("button", { name: "/manager" }));

    expect(mockStartDatadogRouteView.mock.calls).toEqual([["/accounts"], ["/manager"]]);
  });
});
