import React from "react";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { UserRefusedOnDeviceState } from "./UserRefusedOnDeviceState";

describe("UserRefusedOnDeviceState", () => {
  const renderState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <UserRefusedOnDeviceState
        state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
        device={initializerDevice}
        onCancel={onCancel}
      />,
    );
    return { user, retry, onCancel };
  };

  it("GIVEN the user refused state WHEN rendering THEN it shows the operation rejected copy", () => {
    // GIVEN
    renderState();

    // THEN
    expect(screen.getByText("Operation rejected on device")).toBeVisible();
  });

  it("GIVEN the user refused state WHEN clicking Close THEN it calls cancel", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
  });

  it("GIVEN the user refused state WHEN clicking Retry THEN it calls retry", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
