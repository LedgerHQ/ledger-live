import React from "react";
import { cleanup, render, screen } from "@testing-library/react-native";
import { RequestReceiveView } from "../RequestReceiveView.native";
import { createRequestReceiveViewProps, REQUEST_RECEIVE_LABELS } from "./fixtures";

describe("RequestReceiveView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing until the native receive screen ships", () => {
    render(<RequestReceiveView {...createRequestReceiveViewProps()} />);

    expect(screen.queryByText(REQUEST_RECEIVE_LABELS.title)).toBeNull();
    expect(screen.queryByText(REQUEST_RECEIVE_LABELS.networkLabel)).toBeNull();
  });
});
