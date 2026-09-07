import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestReceive } from "../RequestReceive";
import { RequestReceiveView } from "../RequestReceiveView.web";
import { createRequestReceiveProps, REQUEST_RECEIVE_ADDRESS } from "./fixtures";
import type { RequestReceiveProps } from "../../../types";

// The QR renderer draws on a real canvas, which is not meaningful under jsdom; it is unit-tested in
// @shared/ui-qr-code. Stub it here so this suite focuses on the RequestReceive composition.
jest.mock("@shared/ui-qr-code", () => ({
  QrCode: ({ value, testID }: { value: string; testID?: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": testID }, value);
  },
}));

function renderRequestReceive(overrides: Partial<RequestReceiveProps> = {}) {
  const props = createRequestReceiveProps(overrides);
  return { props, ...render(<RequestReceive {...props} />) };
}

describe("RequestReceive (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing while closed", () => {
    renderRequestReceive({ isOpen: false });

    expect(screen.queryByTestId("pay-request-receive")).toBeNull();
  });

  it("renders the title, network and highlighted address", () => {
    renderRequestReceive();

    expect(RequestReceiveView).toEqual(expect.any(Function));
    expect(screen.getByTestId("pay-request-receive")).toBeVisible();
    expect(screen.getByText("Request USD Coin")).toBeVisible();
    expect(screen.getByText("Base network")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-address")).toHaveTextContent(
      REQUEST_RECEIVE_ADDRESS,
    );
  });

  it("renders the QR code for the address", () => {
    renderRequestReceive();

    expect(screen.getByTestId("pay-request-receive-qr-code")).toHaveTextContent(
      REQUEST_RECEIVE_ADDRESS,
    );
  });

  it("renders only the visible actions in order", () => {
    renderRequestReceive({ visibleActions: ["save", "verify"] });

    expect(screen.getByTestId("pay-request-receive-save")).toBeVisible();
    expect(screen.getByTestId("pay-request-receive-verify")).toBeVisible();
    expect(screen.queryByTestId("pay-request-receive-copy")).toBeNull();
    expect(screen.queryByTestId("pay-request-receive-share")).toBeNull();
  });

  it("tracks then invokes the injected callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    await user.click(screen.getByTestId("pay-request-receive-save"));
    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "save",
      buttonLocation: "request",
      page: "Pay",
    });
    expect(props.onSave).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);

    await user.click(screen.getByTestId("pay-request-receive-verify"));
    expect(props.onVerify).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);
  });

  it("flips the copy tile to the copied label after copying", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    const copyTile = screen.getByTestId("pay-request-receive-copy");
    expect(copyTile).toHaveTextContent("Copy");

    await user.click(copyTile);

    expect(props.onCopy).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);
    expect(screen.getByTestId("pay-request-receive-copy")).toHaveTextContent("Copied");
  });

  it("closes from the dialog close button", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(props.onClose).toHaveBeenCalled();
  });
});
