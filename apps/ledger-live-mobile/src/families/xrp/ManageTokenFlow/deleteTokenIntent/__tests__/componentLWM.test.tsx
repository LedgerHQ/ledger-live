import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeleteTokenIntentComponentLWM } from "../componentLWM";

const extraProps = { sponsoredTransfer: false };

describe("DeleteTokenIntentComponentLWM", () => {
  it("keeps a signing failure open with Retry and Close", async () => {
    const retry = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <DeleteTokenIntentComponentLWM
        jobState={{ type: "error", error: new Error("Device busy"), retry }}
        extraProps={extraProps}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("xrp-delete-token-sign-error")).toBeVisible();
    await user.press(screen.getByTestId("xrp-delete-token-sign-retry"));
    await user.press(screen.getByText("Close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the Send signature states for the other job states", () => {
    render(
      <DeleteTokenIntentComponentLWM
        jobState={{ type: "cancelled", retry: jest.fn() }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-signature-cancelled")).toBeVisible();
  });
});
