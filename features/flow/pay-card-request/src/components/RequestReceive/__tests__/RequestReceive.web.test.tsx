import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestReceive } from "../RequestReceive";
import { RequestReceiveView } from "../RequestReceiveView.web";
import { createRequestReceiveProps, REQUEST_RECEIVE_ADDRESS } from "./fixtures";
import type { RequestReceiveProps } from "../../../types";

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

    expect(screen.queryByTestId("pay-card-request-receive")).toBeNull();
  });

  it("renders the title, network and highlighted address", () => {
    renderRequestReceive();

    expect(RequestReceiveView).toEqual(expect.any(Function));
    expect(screen.getByTestId("pay-card-request-receive")).toBeVisible();
    expect(screen.getByText("Request USD Coin")).toBeVisible();
    expect(screen.getByText("Base network")).toBeVisible();
    expect(screen.getByTestId("pay-card-request-receive-address")).toHaveTextContent(
      REQUEST_RECEIVE_ADDRESS,
    );
  });

  it("renders only the visible actions in order", () => {
    renderRequestReceive({ visibleActions: ["save", "verify"] });

    expect(screen.getByTestId("pay-card-request-receive-save")).toBeVisible();
    expect(screen.getByTestId("pay-card-request-receive-verify")).toBeVisible();
    expect(screen.queryByTestId("pay-card-request-receive-copy")).toBeNull();
    expect(screen.queryByTestId("pay-card-request-receive-share")).toBeNull();
  });

  it("tracks then invokes the injected callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    await user.click(screen.getByTestId("pay-card-request-receive-save"));
    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "save",
      buttonLocation: "request",
      page: "Pay",
    });
    expect(props.onSave).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);

    await user.click(screen.getByTestId("pay-card-request-receive-verify"));
    expect(props.onVerify).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);
  });

  it("flips the copy tile to the copied label after copying", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    const copyTile = screen.getByTestId("pay-card-request-receive-copy");
    expect(copyTile).toHaveTextContent("Copy");

    await user.click(copyTile);

    expect(props.onCopy).toHaveBeenCalledWith(REQUEST_RECEIVE_ADDRESS);
    expect(screen.getByTestId("pay-card-request-receive-copy")).toHaveTextContent("Copied");
  });

  it("closes from the dialog close button", async () => {
    const user = userEvent.setup();
    const { props } = renderRequestReceive();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(props.onClose).toHaveBeenCalled();
  });
});
