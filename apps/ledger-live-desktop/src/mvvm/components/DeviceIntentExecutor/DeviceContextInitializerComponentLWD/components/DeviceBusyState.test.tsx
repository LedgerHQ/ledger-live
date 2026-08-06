import React from "react";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { DeviceBusyState } from "./DeviceBusyState";

describe("DeviceBusyState", () => {
  const renderState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <DeviceBusyState
        state={{ type: RetryableStateType.DeviceBusy, retry }}
        device={initializerDevice}
        onCancel={onCancel}
      />,
    );
    return { user, retry, onCancel };
  };

  it("GIVEN the device busy state WHEN rendering THEN it shows the pending action copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Action pending on your Ledger device")).toBeVisible();
  });

  it("GIVEN the device busy state WHEN clicking Retry THEN it calls retry", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("GIVEN the device busy state WHEN clicking Cancel THEN it calls cancel", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
  });
});
