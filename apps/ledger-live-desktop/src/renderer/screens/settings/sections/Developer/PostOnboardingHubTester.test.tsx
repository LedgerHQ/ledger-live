/**
 * @jest-environment jsdom
 */
import React from "react";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE as settingsInitialState } from "~/renderer/reducers/settings";
import PostOnboardingHubTester from "./PostOnboardingHubTester";

const now = new Date("2026-01-02T03:04:05.000Z");

describe("PostOnboardingHubTester", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show a null onboarding date when no date is persisted", () => {
    render(<PostOnboardingHubTester />, {
      initialState: {
        settings: settingsInitialState,
        postOnboarding: {
          ...postOnboardingInitialState,
          onboardingDate: null,
        },
      },
    });

    expect(screen.getByText("Current: null")).toBeVisible();
  });

  it("should show the current onboarding date when one is persisted", () => {
    render(<PostOnboardingHubTester />, {
      initialState: {
        settings: settingsInitialState,
        postOnboarding: {
          ...postOnboardingInitialState,
          onboardingDate: "2024-03-04T05:06:07.000Z",
        },
      },
    });

    expect(screen.getByText("Current: 2024-03-04T05:06:07.000Z")).toBeVisible();
  });

  it("should set and reset the onboarding date from the debug actions", async () => {
    const { store, user } = render(<PostOnboardingHubTester />, {
      initialState: {
        settings: settingsInitialState,
        postOnboarding: {
          ...postOnboardingInitialState,
          onboardingDate: null,
        },
      },
      userEventOptions: { advanceTimers: jest.advanceTimersByTime },
    });

    await user.click(screen.getByRole("button", { name: "Set to today" }));
    expect(store.getState().postOnboarding.onboardingDate).toBe(now.toISOString());

    await user.click(screen.getByRole("button", { name: "Reset to null" }));
    expect(store.getState().postOnboarding.onboardingDate).toBe(null);
  });
});
