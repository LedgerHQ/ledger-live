import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import {
  i18nWrapper,
  REQUEST_RECEIVE_ACTIONS,
  REQUEST_RECEIVE_TITLE,
  REQUEST_RESOURCES,
  VERIFY_HINT_GOT_IT,
  VERIFY_HINT_MESSAGE,
} from "../../../__tests__/i18nWrapper";
import { RequestReceiveView } from "../RequestReceiveView.native";
import { createRequestReceiveViewProps } from "./fixtures";

jest.mock("@shared/ui-qr-code", () => ({
  QrCode: ({ value, testID }: { value: string; testID?: string }) => {
    const React = require("react");
    return React.createElement("View", { testID }, React.createElement("Text", null, value));
  },
}));

function renderView(overrides: Parameters<typeof createRequestReceiveViewProps>[0] = {}) {
  return render(<RequestReceiveView {...createRequestReceiveViewProps(overrides)} />, {
    wrapper: i18nWrapper(REQUEST_RESOURCES),
  });
}

describe("RequestReceiveView (Native)", () => {
  it("renders a full screen with close, QR and the visible actions", () => {
    renderView({ visibleActions: ["share", "copy", "verify"] });

    expect(screen.getByTestId("pay-request-receive")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-close")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-summary")).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_TITLE)).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-qr-code")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-address")).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_ACTIONS.share)).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_ACTIONS.copy)).toBeVisible();
    expect(screen.getByText(REQUEST_RECEIVE_ACTIONS.verify)).toBeVisible();
    expect(screen.queryByTestId("pay-request-receive-save")).not.toBeOnTheScreen();
  });

  it("closes from the top-left close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderView({ onClose });

    await user.press(screen.getByTestId("pay-request-receive-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onCopy when the copy button is pressed", async () => {
    const user = userEvent.setup();
    const onCopy = jest.fn();
    renderView({ visibleActions: ["share", "copy", "verify"], onCopy });

    await user.press(screen.getByTestId("pay-request-receive-copy"));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("dims other actions while the verify hint is open so Verify stays contrast", async () => {
    const user = userEvent.setup();
    const onVerify = jest.fn();
    renderView({
      visibleActions: ["share", "copy", "verify"],
      onVerify,
      verifyHint: {
        open: true,
        onGotIt: jest.fn(),
      },
    });

    expect(screen.getByTestId("pay-request-receive-copy").props.disabled).toBe(true);
    expect(screen.getByTestId("pay-request-receive-share").props.disabled).toBe(true);
    expect(screen.getByTestId("pay-request-receive-verify").props.disabled).toBeFalsy();

    await user.press(screen.getByTestId("pay-request-receive-verify"));
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it("shows the verify hint when open and dismisses it with Got it", async () => {
    const user = userEvent.setup();
    const onGotIt = jest.fn();
    renderView({
      verifyHint: {
        open: true,
        onGotIt,
      },
    });

    expect(screen.getByText(VERIFY_HINT_MESSAGE)).toBeVisible();

    await user.press(screen.getByText(VERIFY_HINT_GOT_IT));

    expect(onGotIt).toHaveBeenCalledTimes(1);
  });

  it("hides the verify hint when it is not open yet", () => {
    renderView({
      verifyHint: {
        open: false,
        onGotIt: jest.fn(),
      },
    });

    expect(screen.queryByText(VERIFY_HINT_MESSAGE)).not.toBeOnTheScreen();
  });

  it("does not close while the verify hint is pending", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderView({
      onClose,
      verifyHint: {
        open: true,
        onGotIt: jest.fn(),
      },
    });

    await user.press(screen.getByTestId("pay-request-receive-close"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
