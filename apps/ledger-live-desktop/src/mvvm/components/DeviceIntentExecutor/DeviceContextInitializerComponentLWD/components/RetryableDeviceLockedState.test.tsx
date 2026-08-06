import React from "react";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { RetryableDeviceLockedState } from "./RetryableDeviceLockedState";

describe("RetryableDeviceLockedState", () => {
  const renderState = () => {
    const retry = jest.fn();
    const { user } = render(
      <RetryableDeviceLockedState
        state={{ type: RetryableStateType.DeviceLocked, retry }}
        device={initializerDevice}
        onCancel={jest.fn()}
      />,
    );
    return { user, retry };
  };

  it("GIVEN the retryable device locked state WHEN rendering THEN it shows the device locked copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Device is locked")).toBeVisible();
  });

  it("GIVEN the retryable device locked state WHEN clicking Retry THEN it calls retry", async () => {
    // GIVEN
    const { user, retry } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
