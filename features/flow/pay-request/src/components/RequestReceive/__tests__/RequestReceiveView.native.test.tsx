import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { RequestReceiveView } from "../RequestReceiveView.native";
import { createRequestReceiveViewProps, REQUEST_RECEIVE_LABELS } from "./fixtures";

jest.mock("@shared/ui-qr-code", () => ({
  QrCode: ({ value, testID }: { value: string; testID?: string }) => {
    const React = require("react");
    return React.createElement("View", { testID }, React.createElement("Text", null, value));
  },
}));

describe("RequestReceiveView (Native)", () => {
  it("renders a full screen with close, QR and the visible actions", () => {
    render(
      <RequestReceiveView
        {...createRequestReceiveViewProps({ visibleActions: ["share", "copy", "verify"] })}
      />,
    );

    expect(screen.getByTestId("pay-request-receive")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-close")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-summary")).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_LABELS.title)).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-qr-code")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-address")).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_LABELS.actions.share)).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_LABELS.actions.copy)).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_LABELS.actions.verify)).toBeVisible();
    expect(screen.queryByTestId("pay-request-receive-save")).toBeNull();
  });

  it("closes from the top-left close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<RequestReceiveView {...createRequestReceiveViewProps({ onClose })} />);

    await user.press(screen.getByTestId("pay-request-receive-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onCopy when the copy button is pressed", async () => {
    const user = userEvent.setup();
    const onCopy = jest.fn();
    render(
      <RequestReceiveView
        {...createRequestReceiveViewProps({ visibleActions: ["share", "copy", "verify"], onCopy })}
      />,
    );

    await user.press(screen.getByTestId("pay-request-receive-copy"));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
