import React from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { render, screen } from "tests/testSetup";
import { useExchangeBackNavigation } from "../hooks/useExchangeBackNavigation";

function ExchangeNavigation() {
  const navigate = useNavigate();
  const navigateBack = useExchangeBackNavigation();

  return (
    <>
      <button
        onClick={() =>
          navigate("/exchange/provider", {
            state: { mode: "buy" },
          })
        }
      >
        Open provider
      </button>
      <button
        onClick={() =>
          navigate("/exchange?referrer=isExternal", {
            state: { mode: "buy" },
          })
        }
      >
        Back to live app
      </button>
      <button
        onClick={() =>
          navigate("/exchange/provider", {
            replace: true,
            state: { mode: "buy" },
          })
        }
      >
        Replace with provider
      </button>
      <button onClick={() => navigate(-1)}>In-webview back</button>
      <button onClick={navigateBack}>Back to asset</button>
    </>
  );
}

function NavigationHarness() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      {location.pathname === "/asset" ? (
        <>
          <button
            onClick={() =>
              navigate("/exchange", {
                state: { returnTo: "/asset" },
              })
            }
          >
            Open live app
          </button>
          <button onClick={() => navigate(-1)}>Back to portfolio</button>
        </>
      ) : null}
      {location.pathname.startsWith("/exchange") ? <ExchangeNavigation /> : null}
    </>
  );
}

describe("useExchangeBackNavigation", () => {
  it("does not stack Asset Detail after three live app round trips", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/portfolio", "/asset"]}>
        <NavigationHarness />
      </MemoryRouter>,
      { skipRouter: true },
    );

    for (let index = 0; index < 3; index++) {
      await user.click(screen.getByRole("button", { name: "Open live app" }));
      await user.click(screen.getByRole("button", { name: "Open provider" }));
      await user.click(screen.getByRole("button", { name: "Back to live app" }));
      await user.click(screen.getByRole("button", { name: "Back to asset" }));

      expect(screen.getByTestId("pathname")).toHaveTextContent("/asset");
    }

    await user.click(screen.getByRole("button", { name: "Back to portfolio" }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/portfolio");
  });

  it("returns to Asset Detail after an in-webview back (POP) within the flow", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/portfolio", "/asset"]}>
        <NavigationHarness />
      </MemoryRouter>,
      { skipRouter: true },
    );

    await user.click(screen.getByRole("button", { name: "Open live app" }));
    await user.click(screen.getByRole("button", { name: "Open provider" }));
    // In-webview back is a history POP (mirrors the "go-back" custom handler); depth must decrement
    // so the header back pops exactly to Asset Detail and not past it to Portfolio.
    await user.click(screen.getByRole("button", { name: "In-webview back" }));
    await user.click(screen.getByRole("button", { name: "Back to asset" }));

    expect(screen.getByTestId("pathname")).toHaveTextContent("/asset");
  });

  it("ignores REPLACE navigations when counting the Exchange depth", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/portfolio", "/asset"]}>
        <NavigationHarness />
      </MemoryRouter>,
      { skipRouter: true },
    );

    await user.click(screen.getByRole("button", { name: "Open live app" }));
    // A REPLACE does not add a history entry, so it must not inflate the depth counter.
    await user.click(screen.getByRole("button", { name: "Replace with provider" }));
    await user.click(screen.getByRole("button", { name: "Back to asset" }));

    expect(screen.getByTestId("pathname")).toHaveTextContent("/asset");
  });

  it("falls back to Portfolio when Exchange has no return route", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/exchange"]}>
        <NavigationHarness />
      </MemoryRouter>,
      { skipRouter: true },
    );

    await user.click(screen.getByRole("button", { name: "Back to asset" }));

    expect(screen.getByTestId("pathname").textContent).toBe("/");
  });
});
