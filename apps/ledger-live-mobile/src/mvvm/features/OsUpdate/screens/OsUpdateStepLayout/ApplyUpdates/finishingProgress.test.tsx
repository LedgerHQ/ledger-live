import React from "react";
import {
  OsUpdatesSteps,
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "@ledgerhq/live-dmk-shared";
import { act, render, screen } from "@tests/test-renderer";
import { FINISHING_ANIMATION_MS } from "../../UpdateProgressScreen/ProgressBar";
import { stax } from "../../../testUtils/connectedDevice.mock";
import { OsUpdateStep } from "../../../components/OsUpdateStep";

const updating = (progress: number): ApplyUpdatesState => ({
  type: ApplyUpdatesStateType.UPDATING,
  progress,
  updateIndex: 2,
  updateCount: 3,
});
const applied: ApplyUpdatesState = {
  type: ApplyUpdatesStateType.UPDATES_APPLIED,
  restoreResult: undefined,
};

const element = (state: ApplyUpdatesState) => (
  <OsUpdateStep
    step={OsUpdatesSteps.APPLY_UPDATES}
    state={state}
    connectedDevice={stax}
    onUserClose={jest.fn()}
    isCloseConfirmationOpen={false}
  />
);

const progressBarValue = () =>
  screen.getByTestId("os-update-progress-bar").props.accessibilityValue.now;

const finishAnimation = () => {
  act(() => {
    jest.advanceTimersByTime(FINISHING_ANIMATION_MS + 50);
  });
};

describe("ApplyUpdates finishing progress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fills the bar up to 100% before showing the success screen", () => {
    const { rerender } = render(element(updating(0.9)));

    rerender(element(applied));

    expect(progressBarValue()).toBe(100);
    expect(screen.queryByTestId("os-update-applied-screen")).toBeNull();

    finishAnimation();

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
    expect(screen.queryByTestId("os-update-progress-screen")).toBeNull();
  });

  it("keeps the update index while the bar fills up", () => {
    const { rerender } = render(element(updating(0.9)));

    rerender(element(applied));

    expect(screen.getByText("Update 2 of 3")).toBeVisible();
  });

  it("still fills the bar when a prompt came between the last progress and the end", () => {
    const { rerender } = render(element(updating(0.9)));
    rerender(element({ type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE }));

    rerender(element(applied));

    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    expect(progressBarValue()).toBe(100);

    finishAnimation();

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
  });

  it("goes straight to the success screen when the bar is already full", () => {
    const { rerender } = render(element(updating(1)));

    rerender(element(applied));

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
  });

  it("goes straight to the success screen when no progress was ever shown", () => {
    render(element(applied));

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
  });

  it("does not show the success screen while an earlier progress animation ends", () => {
    const { rerender } = render(element(updating(0.3)));

    rerender(element(updating(0.6)));
    finishAnimation();

    expect(screen.queryByTestId("os-update-applied-screen")).toBeNull();
    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
  });
});
