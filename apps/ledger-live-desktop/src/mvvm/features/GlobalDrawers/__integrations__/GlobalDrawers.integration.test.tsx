import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import GlobalDrawers from "../index";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";

describe("GlobalDrawers Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing when all drawers are closed", () => {
    const { container } = render(
      <>
        <div id="modals" />
        <GlobalDrawers />
      </>,
      { initialRoute: "/settings/general" },
    );
    expect(container).toBeInTheDocument();
  });

  it("should show wallet sync side drawer when opened", async () => {
    const { store } = render(
      <>
        <div id="modals" />
        <GlobalDrawers />
      </>,
      { initialRoute: "/settings/general" },
    );

    act(() => {
      store.dispatch(setDrawerVisibility(true));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("side-drawer-container")).toBeVisible();
      },
      { timeout: 3000 },
    );
  });

  it("should hide wallet sync side drawer when closed", async () => {
    const { store } = render(
      <>
        <div id="modals" />
        <GlobalDrawers />
      </>,
      { initialRoute: "/settings/general" },
    );

    act(() => {
      store.dispatch(setDrawerVisibility(true));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("side-drawer-container")).toBeVisible();
      },
      { timeout: 3000 },
    );

    act(() => {
      store.dispatch(setDrawerVisibility(false));
    });

    await waitFor(
      () => {
        expect(screen.queryByTestId("side-drawer-container")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it.each([
    "/settings/general",
    "/accounts",
    "/manager",
    "/sync-onboarding/step",
    "/onboarding",
    "/post-onboarding",
    "/portfolio",
  ])("should mount for route %s", pathname => {
    const { container } = render(
      <>
        <div id="modals" />
        <GlobalDrawers />
      </>,
      { initialRoute: pathname },
    );
    expect(container).toBeInTheDocument();
  });
});
