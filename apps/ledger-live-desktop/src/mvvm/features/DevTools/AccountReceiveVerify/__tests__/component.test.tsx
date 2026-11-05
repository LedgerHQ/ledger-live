import React from "react";
import { render, screen } from "tests/testSetup";
import { ReceiveVerifyIntentComponent } from "../component";

describe("ReceiveVerifyIntentComponent", () => {
  it("shows the job state and closes", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <ReceiveVerifyIntentComponent
        jobState={{ type: "verified", address: "0x1" }}
        extraProps={undefined}
        onClose={onClose}
      />,
    );
    expect(screen.getByText(/"verified"/)).toBeVisible();
    expect(screen.queryByText("Retry")).toBeNull();
    await user.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("retries a verification cancelled on the device", async () => {
    const retry = jest.fn();
    const { user } = render(
      <ReceiveVerifyIntentComponent
        jobState={{ type: "cancelled", retry }}
        extraProps={undefined}
        onClose={jest.fn()}
      />,
    );
    await user.click(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("says when the job has not started", () => {
    render(
      <ReceiveVerifyIntentComponent
        jobState={undefined}
        extraProps={undefined}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText("starting…")).toBeVisible();
  });
});
